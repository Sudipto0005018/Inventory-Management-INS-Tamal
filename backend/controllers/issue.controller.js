const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function updatePendingIssue(req, res) {
  const { id } = req.params;
  const {
    nac_no,
    nac_date,
    validity,
    nac_qty,
    rate_unit,
    stocked_in_qty,
    mo_no,
    mo_date,
    qty_received,
  } = req.body;
  const connection = await pool.getConnection();

  const qty = Number(nac_qty || stocked_in_qty || 0);
  if (qty <= 0) {
    return new ApiErrorResponse(400, {}, "invalid qty").send(res);
  }
  try {
    await connection.beginTransaction();
    /* =====================================================
       GET ISSUE
    =====================================================*/
    const [rows] = await connection.query(
      `SELECT * FROM pending_issue WHERE id = ?`,
      [id],
    );
    if (!rows.length) {
      await connection.rollback();
      return new ApiResponse(404, {}, "Pending issue not found").send(res);
    }
    const issue = rows[0];
    const stocked_nac_qty = issue.stocked_nac_qty || 0;
    let status = "pending";
    if (qty + stocked_nac_qty > issue.demand_quantity) {
      return new ApiErrorResponse(400, {}, "Wrong qty").send(res);
    } else if (qty + stocked_nac_qty == issue.demand_quantity) {
      status = "complete";
    } else {
      status = "partial";
    }
    await connection.query(
      `
      UPDATE pending_issue
      SET status = ?, stocked_nac_qty = ?
      WHERE id = ?
    `,
      [status, qty + stocked_nac_qty, id],
    );
    if (nac_no && nac_date && validity && rate_unit) {
      /* =====================================================
       INSERT PROCUREMENT (NAC)
    =====================================================*/
      await connection.query(
        `
        INSERT INTO procurement (
          spare_id, tool_id, box_no,
          nac_qty,
          nac_no, nac_date, validity, rate_unit, issue_date,
          qty_received,
          created_by, approved_by, approved_at,
          status, issue_id
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending',?)
        `,
        [
          issue.spare_id,
          issue.tool_id,
          issue.box_no,
          qty,
          nac_no || null,
          nac_date || null,
          validity || null,
          rate_unit ? parseFloat(rate_unit).toFixed(2) : null,
          issue.demand_date,
          0,
          issue.created_by,
          issue.approved_by,
          issue.approved_at,
          id,
        ],
      );
    }
    /* =====================================================
       INSERT STOCK UPDATE (MO)
    =====================================================*/
    if (mo_no || mo_date) {
      await connection.query(
        `
        INSERT INTO stock_update (
          spare_id, tool_id, box_no,
          stocked_in_qty,
          mo_no, mo_date, issue_date,
          qty_received,
          created_by, approved_by, approved_at,
          status, issued_id
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?, 'pending',?)
        `,
        [
          issue.spare_id,
          issue.tool_id,
          issue.box_no,
          qty,
          mo_no || null,
          mo_date || null,
          issue.demand_date,
          0,
          issue.created_by,
          issue.approved_by,
          issue.approved_at,
          id,
        ],
      );
    }
    await connection.commit();
    new ApiResponse(200, { status }, "Processed successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    new ApiErrorResponse(500, {}, error.message).send(res);
  } finally {
    connection.release();
  }
}

async function getPendingIssue(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    // Item Info
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],

    // Demand fields (pending_issue table)
    mo_no: ["pi.mo_no"],

    demand_date: ["pi.demand_date"],

    demand_quantity: ["pi.demand_quantity"],

    // Stock / NAC
    stocked_nac_qty: ["pi.stocked_nac_qty"],

    // Created
    created_at: ["pi.created_at"],
  };

  const connection = await pool.getConnection();

  try {
    /* =====================================================
       WHERE CLAUSE
       Show ONLY pending + partial
    ======================================================*/
    let whereConditions = [`(pi.status = 'pending' OR pi.status = 'partial')`];
    let queryParams = [];

    /* ================= SEARCH ================= */
    /* ================= SEARCH ================= */
    if (search) {
      let searchConditions = [];

      // Normalize selected columns
      const validCols = rawCols
        .map((c) => c.trim())
        .filter((col) => columnMap[col]);

      // Split by comma OR space
      const searchWords = search
        .split(/[,\s]+/)
        .map((word) => word.trim())
        .filter(Boolean);

      if (validCols.length > 0) {
        // When specific columns are selected
        for (const word of searchWords) {
          let wordConditions = [];

          for (const colName of validCols) {
            const dbColumns = columnMap[colName];

            for (const dbCol of dbColumns) {
              wordConditions.push(`${dbCol} LIKE ?`);
              queryParams.push(`%${word}%`);
            }
          }

          // Each word must match in any selected column
          searchConditions.push(`(${wordConditions.join(" OR ")})`);
        }

        // Combine words using AND
        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      } else {
        // Default fallback search (multi-word enabled)
        for (const word of searchWords) {
          searchConditions.push(`
        (
          sp.description LIKE ?
          OR t.description LIKE ?
        )
      `);

          queryParams.push(`%${word}%`, `%${word}%`);
        }

        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      }
    }

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    /* ================= COUNT ================= */
    const [totalCountRows] = await connection.query(
      `
      SELECT COUNT(*) as count
      FROM pending_issue pi
      LEFT JOIN spares sp ON pi.spare_id = sp.id
      LEFT JOIN tools t ON pi.tool_id = t.id
      ${finalWhereClause}
      `,
      queryParams,
    );

    const totalPending = totalCountRows[0].count;

    if (totalPending === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No pending / partial issue found",
      ).send(res);
    }

    /* ================= DATA ================= */
    const [rows] = await connection.query(
      `
      SELECT 
       pi.*,

CASE 
  WHEN pi.source_type = 'special_demand' 
  THEN pi.mo_no 
  ELSE pi.demand_no 
END AS display_demand_no,

CASE 
  WHEN pi.source_type = 'special_demand' 
  THEN pi.mo_date 
  ELSE pi.demand_date 
END AS display_demand_date,
        COALESCE(sp.description, t.description) as description,
        COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
        COALESCE(sp.category, t.category) as category,
        COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern,
        COALESCE(sp.box_no, t.box_no) as box_no
      FROM pending_issue pi
      LEFT JOIN spares sp ON pi.spare_id = sp.id
      LEFT JOIN tools t ON pi.tool_id = t.id
      ${finalWhereClause}
      ORDER BY pi.id DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalPending,
        totalPages: Math.ceil(totalPending / limit),
        currentPage: page,
      },
      "Pending issues retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting pending issues: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getPendingLogs(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    /* ================= ITEM INFO ================= */
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    box_no: ["sp.box_no", "t.box_no"],

    /* ================= DEMAND FIELDS ================= */
    mo_no: ["pi.mo_no"],
    demand_no: ["pi.demand_no"],
    demand_date: ["pi.demand_date"],
    mo_date: ["pi.mo_date"],

    /* ================= QUANTITY ================= */
    demand_quantity: ["pi.demand_quantity"],
    stocked_nac_qty: ["pi.stocked_nac_qty"],

    /* ================= META ================= */
    source_type: ["pi.source_type"],
    created_at: ["pi.created_at"],
  };

  const connection = await pool.getConnection();

  try {
    /* ================= WHERE ================= */
    let whereConditions = [`pi.status = 'complete'`];
    let queryParams = [];

    /* ================= SEARCH ================= */
    /* ================= SEARCH ================= */
    if (search) {
      let searchConditions = [];

      // Normalize selected columns
      const validCols = rawCols
        .map((c) => c.trim())
        .filter((col) => columnMap[col]);

      // Split by comma OR space
      const searchWords = search
        .split(/[,\s]+/)
        .map((word) => word.trim())
        .filter(Boolean);

      if (validCols.length > 0) {
        // When specific columns are selected
        for (const word of searchWords) {
          let wordConditions = [];

          for (const colName of validCols) {
            const dbColumns = columnMap[colName];

            for (const dbCol of dbColumns) {
              wordConditions.push(`${dbCol} LIKE ?`);
              queryParams.push(`%${word}%`);
            }
          }

          // Each word must match in any selected column
          searchConditions.push(`(${wordConditions.join(" OR ")})`);
        }

        // Combine words using AND
        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      } else {
        // Default fallback search (multi-word enabled)
        for (const word of searchWords) {
          searchConditions.push(`
        (
          sp.description LIKE ?
          OR t.description LIKE ?
        )
      `);

          queryParams.push(`%${word}%`, `%${word}%`);
        }

        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      }
    }

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    /* ================= COUNT ================= */
    const [totalCountRows] = await connection.query(
      `
      SELECT COUNT(*) as count
      FROM pending_issue pi
      LEFT JOIN spares sp ON pi.spare_id = sp.id
      LEFT JOIN tools t ON pi.tool_id = t.id
      ${finalWhereClause}
      `,
      queryParams,
    );

    const totalPending = totalCountRows[0].count;

    if (totalPending === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No completed issue logs found",
      ).send(res);
    }

    /* ================= DATA ================= */
    const [rows] = await connection.query(
      `
      SELECT 
        pi.*,

        CASE 
          WHEN pi.source_type = 'special_demand' 
          THEN pi.mo_no 
          ELSE pi.demand_no 
        END AS display_demand_no,

        CASE 
          WHEN pi.source_type = 'special_demand' 
          THEN pi.mo_date 
          ELSE pi.demand_date 
        END AS display_demand_date,

        COALESCE(sp.description, t.description) as description,
        COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
        COALESCE(sp.category, t.category) as category,
        COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern,
        COALESCE(sp.box_no, t.box_no) as box_no

      FROM pending_issue pi
      LEFT JOIN spares sp ON pi.spare_id = sp.id
      LEFT JOIN tools t ON pi.tool_id = t.id
      ${finalWhereClause}
      ORDER BY pi.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalPending,
        totalPages: Math.ceil(totalPending / limit),
        currentPage: page,
      },
      "Completed issue logs retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting issue logs: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

module.exports = {
  updatePendingIssue,
  getPendingIssue,
  getPendingLogs,
};
