const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function addOem(req, res) {
  try {
    const { name, address, contacts, details } = req.body;
    const query =
      "INSERT INTO oem (name, address, contacts, details) VALUES (?, ?, ?, ?)";
    const [result] = await pool.query(query, [
      name,
      address,
      contacts ? JSON.stringify(contacts) : null,
      details ? JSON.stringify(details) : null,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Failed to add OEM"));
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id: result.insertId, name },
          "OEM added successfully",
        ),
      );
  } catch (error) {
    console.log("Error adding OEM: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getOEMList(req, res) {
  try {
    const query = "SELECT name, id FROM oem";
    const [rows] = await pool.query(query);
    res
      .status(200)
      .json(new ApiResponse(200, rows, "OEMList retrieved successfully"));
  } catch (error) {
    console.log("Error getting OEMList: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getOEMS(req, res) {
  let whereClause = "";
  let params = [];
  if (req.query?.search) {
    whereClause += " AND name LIKE ? OR contact LIKE ?";
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM oem WHERE 1=1 ${whereClause}`,
      params,
    );
    const total = totalRows[0].total;
    if (total === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
          },
          "No OEMS found",
        ),
      );
    }
    const query = `SELECT * FROM oem WHERE 1=1 ${whereClause} LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(query, [...params, limit, offset]);
    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "OEMS retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error getting OEMS: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function updateOem(req, res) {
  try {
    const { id } = req.params;
    const { name, address, contacts, details } = req.body;
    const query =
      "UPDATE oem SET name = ?, address = ?, contacts = ?, details = ? WHERE id = ?";
    const [result] = await pool.query(query, [
      name,
      address,
      contacts ? JSON.stringify(contacts) : null,
      details ? JSON.stringify(details) : null,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Failed to update OEM"));
    }
    res.status(200).json(new ApiResponse(200, {}, "OEM updated successfully"));
  } catch (error) {
    console.log("Error updating OEM: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function deleteOem(req, res) {
  try {
    const { id } = req.params;
    const query = "DELETE FROM oem WHERE id = ?";
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Failed to delete OEM"));
    }
    res.status(200).json(new ApiResponse(200, {}, "OEM deleted successfully"));
  } catch (error) {
    console.log("Error deleting OEM: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getOemById(req, res) {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM oem WHERE id = ?";
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "OEM not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, rows[0], "OEM details retrieved successfully"),
      );
  } catch (error) {
    console.log("Error getting OEM details: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getOEMWithContacts(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        id, 
        name, 
        address, 
        contacts, 
        details 
      FROM oem 
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "OEM not found"));
    }

    // Parse the details JSON to get contact persons
    let contactPersons = [];
    if (rows[0].details) {
      try {
        contactPersons =
          typeof rows[0].details === "string"
            ? JSON.parse(rows[0].details)
            : rows[0].details;
      } catch (e) {
        contactPersons = [];
      }
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          ...rows[0],
          contact_persons: contactPersons,
        },
        "OEM details retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error getting OEM details: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

// Add function to get all OEMs with their contact persons for selection
async function getAllOEMsWithContacts(req, res) {
  try {
    const query = "SELECT id, name, details FROM oem";
    const [rows] = await pool.query(query);

    const formattedRows = rows.map((row) => {
      let contactPersons = [];
      if (row.details) {
        try {
          contactPersons =
            typeof row.details === "string"
              ? JSON.parse(row.details)
              : row.details;
        } catch (e) {
          contactPersons = [];
        }
      }
      return {
        id: row.id,
        name: row.name,
        contact_persons: contactPersons.map((person, index) => ({
          id: index,
          prefix: person.prefix,
          name: person.name,
          designation: person.designation,
          phone: person.phone,
          displayName: `${person.prefix} ${person.name} (${person.designation})`,
        })),
      };
    });

    res
      .status(200)
      .json(new ApiResponse(200, formattedRows, "OEMs retrieved successfully"));
  } catch (error) {
    console.log("Error getting OEMs with contacts: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

// In oem.controller.js
async function getOEMContactPersons(req, res) {
  try {
    const { id } = req.params;
    const query = "SELECT details FROM oem WHERE id = ?";
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "OEM not found"));
    }

    let contactPersons = [];
    if (rows[0].details) {
      try {
        contactPersons =
          typeof rows[0].details === "string"
            ? JSON.parse(rows[0].details)
            : rows[0].details;
      } catch (e) {
        contactPersons = [];
      }
    }

    // Add display names and IDs for each person
    const formattedPersons = contactPersons.map((person, index) => ({
      id: index,
      prefix: person.prefix,
      name: person.name,
      designation: person.designation,
      phone: person.phone,
      displayName: `${person.prefix} ${person.name} - ${person.designation}`,
      fullName: `${person.prefix} ${person.name}`,
    }));

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedPersons,
          "Contact persons retrieved successfully",
        ),
      );
  } catch (error) {
    console.log("Error getting contact persons: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  addOem,
  getOEMList,
  getOEMS,
  updateOem,
  deleteOem,
  getOemById,
  getOEMWithContacts,
  getAllOEMsWithContacts,
  getOEMContactPersons,
};
