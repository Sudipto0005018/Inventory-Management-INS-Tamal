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
  console.log({
    spare_id,
    tool_id,
    withdrawl_qty,
    withdrawl_date,
    box_no,
    service_no,
    name,
    issue_to,
  });

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
      `SELECT category,box_no FROM ${spare_id ? "spares" : "tools"} WHERE id = ?`,
      [spare_id || tool_id],
    );
    if (
      row.category?.toLowerCase() == "c" ||
      row.category?.toLowerCase() == "lp"
    ) {
    } else {
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
      await connection.query(
        `UPDATE ${spare_id ? "spares" : "tools"} SET box_no = ? WHERE id = ?`,
        [JSON.stringify(updated), spare_id || tool_id],
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
  let cols = req.query.cols || "";
  if (cols) {
    cols = cols.split(",");
    let columns = "";
    let params = [];
    for (let i = 0; i < cols.length; i++) {
      if (cols[i]) {
        if (i === cols.length - 1) {
          columns += cols[i] + " LIKE ?";
        } else {
          columns += cols[i] + " LIKE ? OR";
        }
        params.push(`%${search}%`);
      }
    }
  }
  const connection = await pool.getConnection();
  try {
    let whereClause = "";
    let params = [];
    if (search) {
      whereClause = "WHERE s.name LIKE ?";
      params.push(`%${search}%`);
    }
    const [totalCount] = await connection.query(
      `SELECT COUNT(*) as count FROM survey s ${whereClause} ${cols ? "AND " + columns : ""}`,
      [...params, ...params],
    );
    const totalDemand = totalCount[0].count;
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
            CASE 
                WHEN s.spare_id IS NOT NULL THEN sp.description
                WHEN s.tool_id IS NOT NULL THEN t.description
            END as description,
            CASE
                WHEN s.spare_id IS NOT NULL THEN sp.equipment_system
                WHEN s.tool_id IS NOT NULL THEN t.equipment_system
            END as equipment_system,
            CASE
                WHEN s.spare_id IS NOT NULL THEN sp.category
                WHEN s.tool_id IS NOT NULL THEN t.category
            END as category,
            CASE
                WHEN s.spare_id IS NOT NULL THEN sp.category
                WHEN s.tool_id IS NOT NULL THEN t.category
            END as category,
            CASE
                WHEN s.spare_id IS NOT NULL THEN sp.indian_pattern
                WHEN s.tool_id IS NOT NULL THEN t.indian_pattern
            END as indian_pattern
            FROM survey s
            LEFT JOIN spares sp ON s.spare_id = sp.id
            LEFT JOIN tools t ON s.tool_id = t.id
             ${whereClause} ${cols ? "AND " + columns : ""} LIMIT ? OFFSET ?`,
      [...params, limit, offset],
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

async function createDemand(req, res) {
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
    if (!spare_id && !tool_id) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide spare_id or tool_id",
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
      `SELECT category,box_no FROM ${spare_id ? "spares" : "tools"} WHERE id = ?`,
      [spare_id || tool_id],
    );
    if (
      row.category?.toLowerCase() == "c" ||
      row.category?.toLowerCase() == "lp"
    ) {
    } else {
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
        `INSERT INTO demand (spare_id, tool_id, withdrawl_qty, withdrawl_date, box_no, service_no, name, issue_to, created_by, transaction_id,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      await connection.query(
        `UPDATE ${spare_id ? "spares" : "tools"} SET box_no = ? WHERE id = ?`,
        [JSON.stringify(updated), spare_id || tool_id],
      );
    }

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

module.exports = {
  createSurvey,
  getSurveys,
  createDemand,
};
