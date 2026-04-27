const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function addSupplier(req, res) {
  try {
    const { name, address, contacts, details } = req.body;
    const query =
      "INSERT INTO supplier (name, address, contacts, details) VALUES (?, ?, ?, ?)";
    const [result] = await pool.query(query, [
      name,
      address,
      contacts ? JSON.stringify(contacts) : null,
      details ? JSON.stringify(details) : null,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Failed to add supplier"));
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id: result.insertId, name },
          "Supplier added successfully",
        ),
      );
  } catch (error) {
    console.log("Error adding supplier: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getSupplierList(req, res) {
  try {
    const query = "SELECT name, id FROM supplier";
    const [rows] = await pool.query(query);
    res
      .status(200)
      .json(new ApiResponse(200, rows, "Supplier List retrieved successfully"));
  } catch (error) {
    console.log("Error getting supplier List: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getSuppliers(req, res) {
  let whereClause = "";
  let params = [];
  if (req.query?.search) {
    whereClause += " AND name LIKE ? OR contacts LIKE ?";
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM supplier WHERE 1=1 ${whereClause}`,
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
          "No suppliers found",
        ),
      );
    }
    const query = `SELECT * FROM supplier WHERE 1=1 ${whereClause} LIMIT ? OFFSET ?`;
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
        "Suppliers retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error getting suppliers: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const { name, address, contacts, details } = req.body;
    const query =
      "UPDATE supplier SET name = ?, address = ?, contacts = ?, details = ? WHERE id = ?";
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
        .json(new ApiErrorResponse(400, {}, "Failed to update Supplier"));
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Supplier updated successfully"));
  } catch (error) {
    console.log("Error updating supplier: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    const query = "DELETE FROM supplier WHERE id = ?";
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Failed to delete supplier"));
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Supplier deleted successfully"));
  } catch (error) {
    console.log("Error deleting supplier: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getSupplierById(req, res) {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM supplier WHERE id = ?";
    const [rows] = await pool.query(query, [id]);
    console.log(id);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Supplier not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          rows[0],
          "Supplier details retrieved successfully",
        ),
      );
  } catch (error) {
    console.log("Error getting supplier details: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}


async function getSupplierWithContacts(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        id, 
        name, 
        address, 
        contacts, 
        details 
      FROM supplier 
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Supplier not found"));
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
        "Supplier details retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error getting Supplier details: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

// Add function to get all Suppliers with their contact persons for selection
async function getAllSuppliersWithContacts(req, res) {
  try {
    const query = "SELECT id, name, details FROM supplier";
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
      .json(new ApiResponse(200, formattedRows, "Suppliers retrieved successfully"));
  } catch (error) {
    console.log("Error getting Suppliers with contacts: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

// In supplier.controller.js
async function getSupplierContactPersons(req, res) {
  try {
    const { id } = req.params;
    const query = "SELECT details FROM supplier WHERE id = ?";
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Supplier not found"));
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
  addSupplier,
  getSupplierList,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
  getSupplierWithContacts,
  getAllSuppliersWithContacts,
  getSupplierContactPersons,
};
