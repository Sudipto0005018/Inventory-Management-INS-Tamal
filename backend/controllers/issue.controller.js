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
    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((col) => columnMap[col.trim()]);

      if (validCols.length > 0) {
        for (const colName of validCols) {
          const dbColumns = columnMap[colName.trim()];
          const subQuery = dbColumns
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${subQuery})`);
        }
      } else {
        searchFragments.push(`(sp.description LIKE ? OR t.description LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      whereConditions.push(`(${searchFragments.join(" OR ")})`);
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
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
  };

  const connection = await pool.getConnection();

  try {
    let whereConditions = [`pi.status = 'complete'`];
    let queryParams = [];

    /* ================= SEARCH ================= */
    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((col) => columnMap[col.trim()]);

      if (validCols.length > 0) {
        for (const colName of validCols) {
          const dbColumns = columnMap[colName.trim()];
          const subQuery = dbColumns
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${subQuery})`);
        }
      } else {
        searchFragments.push(`(sp.description LIKE ? OR t.description LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      whereConditions.push(`(${searchFragments.join(" OR ")})`);
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
        "No complete / partial issue found",
      ).send(res);
    }

    /* ================= DATA ================= */
    const [rows] = await connection.query(
      `
      SELECT 
        pi.*,
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
      "Complete & partial issues retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting issues: ", error);
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
