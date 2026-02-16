const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function createSurvey(req, res) {
  const {
    spare_id,
    tool_id,
    withdrawl_qty,
    withdrawl_date,
    box_no,
    service_no,
    name,
    issue_to,
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id: created_by } = req.user;
    if (!spare_id && !tool_id) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide either spare_id or tool_id",
      ).send(res);
    }
    if (
      !withdrawl_qty ||
      !withdrawl_date ||
      !box_no ||
      !service_no ||
      !name ||
      !issue_to
    ) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide all required fields",
      ).send(res);
    }
    let transactionId = "PI" + Date.now();
    const [[row]] = await connection.query(
      `SELECT category,box_no,obs_held FROM ${spare_id ? "spares" : "tools"} WHERE id = ?`,
      [spare_id || tool_id],
    );
    if (
      row.category?.toLowerCase() == "c" ||
      row.category?.toLowerCase() == "lp"
    ) {
      await connection.query(
        `INSERT INTO demand (spare_id,tool_id,issue_to,transaction_id,survey_qty,survey_voucher_no,survey_date,created_at,created_by,status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          spare_id || null,
          tool_id || null,
          issue_to,
          transactionId,
          withdrawl_qty,
          service_no,
          withdrawl_date,
          getSQLTimestamp(),
          created_by,
          "pending",
        ],
      );
    } else {
      if (!box_no) {
        return new ApiErrorResponse(
          400,
          {},
          "box_no is required for this category",
        ).send(res);
      }
      const itemBoxNo = JSON.parse(row.box_no);

      const updated = itemBoxNo.map((spare) => {
        const match = box_no.find((item) => item.no == spare.no);
        if (match) {
          return {
            ...spare,
            qtyHeld: (
              parseInt(spare.qtyHeld) - parseInt(match.withdraw)
            ).toString(),
          };
        }
      });
      await connection.query(
        `INSERT INTO survey (spare_id, tool_id, withdrawl_qty, withdrawl_date, box_no, service_no, name, issue_to, created_by, transaction_id,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          spare_id || null,
          tool_id || null,
          withdrawl_qty,
          withdrawl_date,
          JSON.stringify(updated),
          service_no,
          name,
          issue_to,
          created_by,
          transactionId,
          getSQLTimestamp(),
        ],
      );
      if (row.obs_held - withdrawl_qty < 0) {
        return new ApiErrorResponse(400, {}, "Invalid withdrawl quantity").send(
          res,
        );
      }
      await connection.query(
        `UPDATE ${spare_id ? "spares" : "tools"} SET box_no = ?,obs_held = ? WHERE id = ?`,
        [
          JSON.stringify(updated),
          row.obs_held - withdrawl_qty,
          spare_id || tool_id,
        ],
      );
    }

    await connection.commit();
    new ApiResponse(201, {}, "Survey created successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.log("Error while creating survey: ", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getSurveys(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];
  const status = req.query.status || "pending";

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
  };

  const connection = await pool.getConnection();

  try {
    let whereConditions = ["s.status = ?"];
    let queryParams = [status];

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

      if (searchFragments.length > 0) {
        whereConditions.push(`(${searchFragments.join(" OR ")})`);
      }
    }

    const finalWhereClause = "WHERE " + whereConditions.join(" AND ");

    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM survey s 
             LEFT JOIN spares sp ON s.spare_id = sp.id 
             LEFT JOIN tools t ON s.tool_id = t.id 
             ${finalWhereClause}`,
      queryParams,
    );

    const totalDemand = totalCountRows[0].count;

    if (totalDemand === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        search ? "No matching demand found" : "No demand found",
      ).send(res);
    }

    const [rows] = await connection.query(
      `SELECT 
                s.*,
                COALESCE(sp.description, t.description) as description,
                COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
                COALESCE(sp.category, t.category) as category,
                COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
             FROM survey s
             LEFT JOIN spares sp ON s.spare_id = sp.id
             LEFT JOIN tools t ON s.tool_id = t.id
             ${finalWhereClause} 
             ORDER BY s.id DESC
             LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalDemand,
        totalPages: Math.ceil(totalDemand / limit),
        currentPage: page,
      },
      "Survey retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting survey: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getLogSurveys(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  // ❌ REMOVE dynamic status
  // const status = req.query.status || "pending";

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
  };

  const connection = await pool.getConnection();

  try {
    /* ---------- FORCE COMPLETED ---------- */
    let whereConditions = ["s.status = ?"];
    let queryParams = ["complete"]; // 👈 FIXED STATUS

    /* ---------- SEARCH ---------- */
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

      if (searchFragments.length > 0) {
        whereConditions.push(`(${searchFragments.join(" OR ")})`);
      }
    }

    const finalWhereClause = "WHERE " + whereConditions.join(" AND ");

    /* ---------- COUNT ---------- */
    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM survey s 
       LEFT JOIN spares sp ON s.spare_id = sp.id 
       LEFT JOIN tools t ON s.tool_id = t.id 
       ${finalWhereClause}`,
      queryParams,
    );

    const totalDemand = totalCountRows[0].count;

    if (totalDemand === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No completed survey found",
      ).send(res);
    }

    /* ---------- FETCH ROWS ---------- */
    const [rows] = await connection.query(
      `SELECT 
          s.*,
          COALESCE(sp.description, t.description) as description,
          COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
          COALESCE(sp.category, t.category) as category,
          COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
       FROM survey s
       LEFT JOIN spares sp ON s.spare_id = sp.id
       LEFT JOIN tools t ON s.tool_id = t.id
       ${finalWhereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    /* ---------- RESPONSE ---------- */
    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalDemand,
        totalPages: Math.ceil(totalDemand / limit),
        currentPage: page,
      },
      "Completed surveys retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting survey: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

module.exports = {
  createSurvey,
  getSurveys,
  getLogSurveys,
};
