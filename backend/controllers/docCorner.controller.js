const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { unlinkFile } = require("../middlewares/file");

const createDocCorner = async (req, res) => {
  const {
    description,
    folder_no,
    equipment_system,
    denos,
    obs_authorised,
    obs_authorised_new,
    obs_held,
    b_d_authorised,
    category,
    box_no,
    item_distribution,
    storage_location,
    item_code,
    indian_pattern,
    remarks,
    nac_date,
    uidoem,
    supplier,
    substitute_name,
    local_terminology,
  } = req.body;

  const department = req.department;

  try {
    if (!description || !equipment_system) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(
            400,
            {},
            "Description & Equipment System required",
          ),
        );
    }

    const query = `
      INSERT INTO doc_corner
      (
        description,
        folder_no,
        equipment_system,
        denos,
        obs_authorised,
        obs_authorised_new,
        obs_held,
        b_d_authorised,
        category,
        box_no,
        item_distribution,
        storage_location,
        item_code,
        indian_pattern,
        remarks,
        department,
        nac_date,
        uidoem,
        supplier,
        substitute_name,
        local_terminology
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      description,
      folder_no || null,
      equipment_system,
      denos || null,
      obs_authorised || null,
      obs_authorised_new || null,
      obs_held || null,
      b_d_authorised || null,
      category || null,
      box_no ? JSON.stringify(box_no) : null,
      item_distribution || null,
      storage_location || null,
      item_code || null,
      indian_pattern || null,
      remarks || null,
      department.id,
      nac_date || null,
      uidoem || null,
      supplier || null,
      substitute_name || null,
      local_terminology || null,
    ]);

    if (!result.insertId) {
      return res
        .status(500)
        .json(new ApiErrorResponse(500, {}, "Document creation failed"));
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id: result.insertId },
          "Document created successfully",
        ),
      );
  } catch (error) {
    console.log("Error creating document: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

async function getDocCorner(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;

  try {
    let whereClause = "WHERE department = ?";
    let params = [department.id];

    if (search) {
      whereClause += `
        AND (
          description LIKE ?
          OR equipment_system LIKE ?
          OR folder_no LIKE ?
          OR item_code LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM doc_corner ${whereClause}`,
      params,
    );

    const totalItems = totalCount[0].count;

    if (totalItems === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
          },
          search ? "No matching documents found" : "No documents found",
        ),
      );
    }

    const query = `
      SELECT *, 'doc_corner' AS source
      FROM doc_corner
      ${whereClause}
      ORDER BY description ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
        },
        "Documents retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error while getting documents: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function updateDocCorner(req, res) {
  const { id } = req.params;

  const {
    description,
    folder_no,
    equipment_system,
    denos,
    obs_authorised,
    obs_authorised_new,
    obs_held,
    b_d_authorised,
    category,
    box_no,
    item_distribution,
    storage_location,
    item_code,
    indian_pattern,
    remarks,
    nac_date,
    uidoem,
    supplier,
    substitute_name,
    local_terminology,
  } = req.body;

  if (!description || !equipment_system) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE doc_corner
      SET
        description = ?,
        folder_no = ?,
        equipment_system = ?,
        denos = ?,
        obs_authorised = ?,
        obs_authorised_new = ?,
        obs_held = ?,
        b_d_authorised = ?,
        category = ?,
        box_no = ?,
        item_distribution = ?,
        storage_location = ?,
        item_code = ?,
        indian_pattern = ?,
        remarks = ?,
        nac_date = ?,
        uidoem = ?,
        supplier = ?,
        substitute_name = ?,
        local_terminology = ?
      WHERE id = ?
      `,
      [
        description,
        folder_no || null,
        equipment_system,
        denos || null,
        obs_authorised || null,
        obs_authorised_new || null,
        obs_held || null,
        b_d_authorised || null,
        category || null,
        box_no ? JSON.stringify(box_no) : null,
        item_distribution || null,
        storage_location || null,
        item_code || null,
        indian_pattern || null,
        remarks || null,
        nac_date || null,
        uidoem || null,
        supplier || null,
        substitute_name || null,
        local_terminology || null,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Document not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Document updated successfully"));
  } catch (error) {
    console.error("Error while updating document:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  createDocCorner,
  getDocCorner,
  updateDocCorner,
};
