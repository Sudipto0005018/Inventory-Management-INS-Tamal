const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function createDemand(req, res) {
  const {
    spare_id,
    tool_id,
    survey_qty,
    survey_voucher_no,
    survey_date,
    transaction_id,
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!spare_id && !tool_id) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide spare_id or tool_id",
      ).send(res);
    }
    if (!survey_qty || !survey_voucher_no || !transaction_id || !survey_date) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide all required fields",
      ).send(res);
    }
    const [[row]] = await connection.query(
      `SELECT id, withdrawl_qty, survey_quantity FROM survey WHERE transaction_id = ?`,
      [transaction_id],
    );
    let status = "pending";

    if (row.withdrawl_qty < row.survey_quantity + Number(survey_qty)) {
      return new ApiErrorResponse(
        400,
        {},
        "Survey quantity is greater than withdrawl quantity",
      ).send(res);
    } else if (row.withdrawl_qty == row.survey_quantity + Number(survey_qty)) {
      status = "complete";
      await connection.query(
        `UPDATE survey SET status = ?, survey_quantity = ? WHERE id = ?`,
        [status, row.survey_quantity + Number(survey_qty), row.id],
      );
    } else {
      await connection.query(
        `UPDATE survey SET status = ?, survey_quantity = ? WHERE id = ?`,
        [status, row.survey_quantity + Number(survey_qty), row.id],
      );
    }
    await connection.query(
      `INSERT INTO demand (spare_id, tool_id, transaction_id, survey_qty, survey_voucher_no, survey_date, created_at, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        spare_id || null,
        tool_id || null,
        transaction_id,
        survey_qty,
        survey_voucher_no,
        survey_date,
        getSQLTimestamp(),
        req.user.id,
      ],
    );
    await connection.commit();
    new ApiResponse(201, {}, "Demand created successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.log("Error while creating demand: ", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getDemands(req, res) {
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
    // Alias 'd' for demand table
    let whereConditions = ["d.status = ?"];
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

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM demand d 
             LEFT JOIN spares sp ON d.spare_id = sp.id 
             LEFT JOIN tools t ON d.tool_id = t.id 
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
                d.*,
                COALESCE(sp.description, t.description) as description,
                COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
                COALESCE(sp.category, t.category) as category,
                COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
             FROM demand d
             LEFT JOIN spares sp ON d.spare_id = sp.id
             LEFT JOIN tools t ON d.tool_id = t.id
             ${finalWhereClause} 
             ORDER BY d.created_at DESC
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
      "Demands retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting demands: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function createPendingIssue(req, res) {
  const {
    id,
    demand_no,
    demand_date,

    // NAC fields
    nac_no,
    nac_date,
    validity,
    rate_unit,

    // Stocking fields
    mo_no,
    mo_date,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(`SELECT * FROM demand WHERE id = ?`, [
      id,
    ]);

    if (rows.length === 0) {
      await connection.rollback();
      return new ApiResponse(404, {}, "Demand not found").send(res);
    }

    const demand = rows[0];

    await connection.query(
      `
      INSERT INTO pending_issue (
        demand_no,
        demand_date,
        transaction_id,
        spare_id,
        tool_id,
        created_at,
        created_by,
        demand_quantity,

        nac_no,
        nac_date,
        validity,
        rate_unit,
        mo_no,
        mo_date,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        demand_no,
        demand_date,
        demand.transaction_id,
        demand.spare_id,
        demand.tool_id,
        getSQLTimestamp(),
        req.user.id,
        demand.survey_qty,

        nac_no || null,
        nac_date || null,
        validity || null,
        rate_unit || null,
        mo_no || null,
        mo_date || null,
        "pending",
      ],
    );

    await connection.query(
      `UPDATE demand SET status = 'complete' WHERE id = ?`,
      [id],
    );

    await connection.commit();

    new ApiResponse(201, {}, "Pending issue created successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.error("Error while creating pending issue:", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
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
  const status = req.query.status || "pending";

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
  };

  const connection = await pool.getConnection();

  try {
    // Alias 'pi' for pending_issue table
    let whereConditions = ["pi.status = ?"];
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

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM pending_issue pi 
             LEFT JOIN spares sp ON pi.spare_id = sp.id 
             LEFT JOIN tools t ON pi.tool_id = t.id 
             ${finalWhereClause}`,
      queryParams,
    );

    const totalPending = totalCountRows[0].count;

    if (totalPending === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        search ? "No matching pending issue found" : "No pending issue found",
      ).send(res);
    }

    const [rows] = await connection.query(
      `SELECT 
                pi.*,
                COALESCE(sp.description, t.description) as description,
                COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
                COALESCE(sp.category, t.category) as category,
                COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
             FROM pending_issue pi
             LEFT JOIN spares sp ON pi.spare_id = sp.id
             LEFT JOIN tools t ON pi.tool_id = t.id
             ${finalWhereClause} 
             ORDER BY pi.created_at DESC
             LIMIT ? OFFSET ?`,
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

// UPDATE PENDING ISSUE
async function updatePendingIssue(req, res) {
  const { id } = req.params;

  const { nac_no, nac_date, validity, rate_unit, mo_no, mo_date, status } =
    req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT id FROM pending_issue WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return new ApiResponse(404, {}, "Pending issue not found").send(res);
    }

    const updateFields = [];
    const updateValues = [];

    if (nac_no !== undefined) {
      updateFields.push("nac_no = ?");
      updateValues.push(nac_no);
    }

    if (nac_date !== undefined) {
      updateFields.push("nac_date = ?");
      updateValues.push(nac_date);
    }

    if (validity !== undefined) {
      updateFields.push("validity = ?");
      updateValues.push(validity);
    }

    if (rate_unit !== undefined) {
      updateFields.push("rate_unit = ?");
      updateValues.push(parseFloat(rate_unit).toFixed(2));
    }

    if (mo_no !== undefined) {
      updateFields.push("mo_no = ?");
      updateValues.push(mo_no);
    }

    if (mo_date !== undefined) {
      updateFields.push("mo_date = ?");
      updateValues.push(mo_date);
    }

    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      await connection.rollback();
      return new ApiResponse(400, {}, "No fields to update").send(res);
    }

    updateValues.push(id);

    const updateQuery = `
      UPDATE pending_issue
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    await connection.query(updateQuery, updateValues);

    await connection.commit();

    new ApiResponse(200, {}, "Pending issue updated successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.error("Error updating pending issue:", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

module.exports = {
  createDemand,
  getDemands,
  createPendingIssue,
  getPendingIssue,
  updatePendingIssue,
};
