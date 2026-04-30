// controllers/nominalRoll.controller.js
const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

// Helper function to format date for MySQL
const formatDateForMySQL = (date) => {
  if (!date) return null;
  const d = new Date(date);
  // Return YYYY-MM-DD format
  return d.toISOString().split("T")[0];
};

// Get present personnel (not transferred out)
const getPresentPersonnel = async (req, res) => {
  const department = req.department;

  try {
    const [personnel] = await pool.query(
      `SELECT * FROM nominal_roll 
       WHERE department_id = ? AND is_transferred = 0 
       ORDER BY created_at DESC`,
      [department.id],
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          personnel,
          "Present personnel retrieved successfully",
        ),
      );
  } catch (error) {
    console.error("Error fetching present personnel:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

// Get ex-Tamal personnel (transferred out)
const getExPersonnel = async (req, res) => {
  const department = req.department;

  try {
    const [personnel] = await pool.query(
      `SELECT * FROM nominal_roll 
       WHERE department_id = ? AND is_transferred = 1 
       ORDER BY transfer_date DESC`,
      [department.id],
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          personnel,
          "Ex-Tamal personnel retrieved successfully",
        ),
      );
  } catch (error) {
    console.error("Error fetching ex-personnel:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

// Add new personnel
const addPersonnel = async (req, res) => {
  const { service_no, name, rank, contact_no, date_of_reporting } = req.body;
  const department = req.department;

  // console.log("=== ADD PERSONNEL DEBUG ===");
  // console.log("Request body:", req.body);
  // console.log("Department:", department);
  // console.log("Department ID:", department?.id);

  try {
    // Validate required fields
    if (!service_no || !service_no.trim()) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Service No. is required"));
    }
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Name is required"));
    }
    if (!rank || !rank.trim()) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Rank is required"));
    }
    if (!department || !department.id) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Department information missing"));
    }

    // Check if service number already exists in present personnel
    const [existing] = await pool.query(
      `SELECT id FROM nominal_roll WHERE service_no = ? AND department_id = ? AND is_transferred = 0`,
      [service_no.trim(), department.id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Service No. already exists"));
    }

    // Format the date properly for MySQL
    const formattedDate = formatDateForMySQL(date_of_reporting);
    console.log("Formatted date:", formattedDate);

    // Insert new personnel - rank is escaped with backticks because it's a reserved keyword
    const [result] = await pool.query(
      `INSERT INTO nominal_roll 
       (service_no, name, \`rank\`, contact_no, date_of_reporting, department_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        service_no.trim().toUpperCase(),
        name.trim().toUpperCase(),
        rank.trim().toUpperCase(),
        contact_no || null,
        formattedDate, // Use formatted date instead of raw date
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
          "Personnel added successfully",
        ),
      );
  } catch (error) {
    console.error("Error adding personnel:", error);
    console.error("SQL Error code:", error.code);
    console.error("SQL Error message:", error.sqlMessage);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, error.sqlMessage || error.message));
  }
};

// Update personnel (service_no should NOT be updated)
const updatePersonnel = async (req, res) => {
  const { id } = req.params;
  // Remove service_no from destructuring since it shouldn't be updated
  const { name, rank, contact_no, date_of_reporting } = req.body;
  const department = req.department;

  try {
    const [existing] = await pool.query(
      `SELECT id FROM nominal_roll WHERE id = ? AND department_id = ?`,
      [id, department.id],
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Personnel not found"));
    }

    // Format the date properly for MySQL
    const formattedDate = formatDateForMySQL(date_of_reporting);

    // NOTE: service_no is NOT included in the update query
    await pool.query(
      `UPDATE nominal_roll 
       SET name = ?, \`rank\` = ?, contact_no = ?, date_of_reporting = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name?.trim().toUpperCase() || null,
        rank?.trim().toUpperCase() || null,
        contact_no || null,
        formattedDate,
        id,
      ],
    );

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Personnel updated successfully"));
  } catch (error) {
    console.error("Error updating personnel:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

// Transfer personnel to ex-Tamal
const transferPersonnel = async (req, res) => {
  const { id } = req.params;
  const { transfer_date } = req.body;
  const department = req.department;

  try {
    const [personnel] = await pool.query(
      `SELECT id FROM nominal_roll WHERE id = ? AND department_id = ? AND is_transferred = 0`,
      [id, department.id],
    );

    if (personnel.length === 0) {
      return res
        .status(404)
        .json(
          new ApiErrorResponse(
            404,
            {},
            "Personnel not found or already transferred",
          ),
        );
    }

    // Format the transfer date properly for MySQL
    const formattedTransferDate = formatDateForMySQL(transfer_date);

    await pool.query(
      `UPDATE nominal_roll 
       SET is_transferred = 1, transfer_date = ?, transferred_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [formattedTransferDate, req.user?.id || null, id],
    );

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Personnel transferred successfully"));
  } catch (error) {
    console.error("Error transferring personnel:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

// Delete personnel
const deletePersonnel = async (req, res) => {
  const { id } = req.params;
  const department = req.department;

  try {
    const [existing] = await pool.query(
      `SELECT id FROM nominal_roll WHERE id = ? AND department_id = ?`,
      [id, department.id],
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Personnel not found"));
    }

    await pool.query(`DELETE FROM nominal_roll WHERE id = ?`, [id]);

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Personnel deleted successfully"));
  } catch (error) {
    console.error("Error deleting personnel:", error);
    res.status(500).json(new ApiErrorResponse(500, {}, error.message));
  }
};

module.exports = {
  getPresentPersonnel,
  getExPersonnel,
  addPersonnel,
  updatePersonnel,
  transferPersonnel,
  deletePersonnel,
};
