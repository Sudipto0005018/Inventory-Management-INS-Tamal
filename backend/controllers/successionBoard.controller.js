// controllers/successionBoard.controller.js
const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

// Helper function to format date for MySQL
const formatDateForMySQL = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Get current succession board data
const getSuccessionBoard = async (req, res) => {
  const department = req.department;

  try {
    // Get current active records (to_date is null)
    const [activeRecords] = await pool.query(
      `SELECT * FROM succession_board 
       WHERE department_id = ? AND to_date IS NULL
       ORDER BY 
         CASE position 
           WHEN 'officer_incharge' THEN 1 
           WHEN 'storekeeper' THEN 2 
           WHEN 'asst_storekeeper' THEN 3 
         END`,
      [department.id],
    );

    // Get history records (to_date is not null)
    const [historyRecords] = await pool.query(
      `SELECT * FROM succession_board 
       WHERE department_id = ? AND to_date IS NOT NULL
       ORDER BY to_date DESC`,
      [department.id],
    );

    // Organize data by position
    const result = {
      officer_incharge: null,
      storekeeper: null,
      asst_storekeeper: null,
      officer_incharge_history: [],
      storekeeper_history: [],
      asst_storekeeper_history: [],
    };

    activeRecords.forEach((record) => {
      result[record.position] = record;
    });

    historyRecords.forEach((record) => {
      result[`${record.position}_history`].push(record);
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Succession board retrieved successfully"),
      );
  } catch (error) {
    console.error("Error fetching succession board:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

// Add or update succession record
const addSuccession = async (req, res) => {
  const { position, name, rank, service_no, contact, from_date, to_date } =
    req.body;
  const department = req.department;

  console.log("=== ADD SUCCESSION DEBUG ===");
  console.log("Request body:", req.body);
  console.log("Department:", department);

  try {
    // Validate required fields
    if (!position || !name || !rank || !service_no) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(400, {}, "All required fields must be filled"),
        );
    }

    // Check if there's an active record for this position
    const [active] = await pool.query(
      `SELECT id FROM succession_board 
       WHERE department_id = ? AND position = ? AND to_date IS NULL`,
      [department.id, position],
    );

    // If there's an active record, don't allow new one without ending it
    if (active.length > 0 && (!to_date || to_date === null)) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(
            400,
            {},
            `There is already an active ${position}. Please end their tenure first.`,
          ),
        );
    }

    // Format dates
    const formattedFromDate = formatDateForMySQL(from_date);
    const formattedToDate = formatDateForMySQL(to_date);

    // IMPORTANT: rank is escaped with backticks because it's a reserved keyword
    const [result] = await pool.query(
      `INSERT INTO succession_board 
       (position, name, \`rank\`, service_no, contact, from_date, to_date, department_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        position,
        name.toUpperCase(),
        rank.toUpperCase(),
        service_no.toUpperCase(),
        contact || null,
        formattedFromDate,
        formattedToDate || null,
        department.id,
        req.user?.id || null,
      ],
    );

    console.log("Insert result:", result);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id: result.insertId },
          "Succession record added successfully",
        ),
      );
  } catch (error) {
    console.error("Error adding succession record:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, error.sqlMessage || error.message));
  }
};

// Update succession record (mainly for ending tenure)
const updateSuccession = async (req, res) => {
  const { id } = req.params;
  const { to_date, name, rank, service_no, contact, from_date } = req.body;
  const department = req.department;

  try {
    // Check if record exists
    const [existing] = await pool.query(
      `SELECT id FROM succession_board WHERE id = ? AND department_id = ?`,
      [id, department.id],
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Record not found"));
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (to_date !== undefined) {
      updates.push("to_date = ?");
      values.push(formatDateForMySQL(to_date));
    }
    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name.toUpperCase());
    }
    if (rank !== undefined) {
      updates.push("`rank` = ?"); // Escape rank with backticks
      values.push(rank.toUpperCase());
    }
    if (service_no !== undefined) {
      updates.push("service_no = ?");
      values.push(service_no.toUpperCase());
    }
    if (contact !== undefined) {
      updates.push("contact = ?");
      values.push(contact);
    }
    if (from_date !== undefined) {
      updates.push("from_date = ?");
      values.push(formatDateForMySQL(from_date));
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    if (updates.length > 1) {
      await pool.query(
        `UPDATE succession_board SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Succession record updated successfully"));
  } catch (error) {
    console.error("Error updating succession record:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

// Delete succession record
const deleteSuccession = async (req, res) => {
  const { id } = req.params;
  const department = req.department;

  try {
    const [existing] = await pool.query(
      `SELECT id FROM succession_board WHERE id = ? AND department_id = ?`,
      [id, department.id],
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Record not found"));
    }

    await pool.query(`DELETE FROM succession_board WHERE id = ?`, [id]);

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Succession record deleted successfully"));
  } catch (error) {
    console.error("Error deleting succession record:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

module.exports = {
  getSuccessionBoard,
  addSuccession,
  updateSuccession,
  deleteSuccession,
};
