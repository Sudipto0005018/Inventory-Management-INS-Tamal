const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

// {
//     type: "location_of_storage",
//     attr:["Rack 1"]
// }
// {
//   type: "service_no",
//   attr: ["12345", "Ravi Kumar"],
// };
async function addConfig(req, res) {
  try {
    const { type, attr } = req.body;
    if (!type || !Array.isArray(attr)) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Invalid request"));
    }
    if (attr.length == 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Invalid request"));
    }
    let cols = "";
    let vals = "";
    const values = [type];
    for (let i = 0; i < attr.length; i++) {
      if (i == attr.length - 1) {
        cols += "attr_" + (i + 1);
        vals += "?";
      } else {
        cols += "attr_" + (i + 1) + ",";
        vals += "?,";
      }
      values.push(attr[i]);
    }
    const query = `INSERT INTO config (type,${cols}) Values(?,${vals})`;
    const [result] = await pool.query(query, values);
    res.status(200).json(new ApiResponse(200, {}, "added"));
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function deleteConfig(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`DELETE FROM config WHERE id = ?`, [id]);
    if (rows.affectedRows > 0) {
      res.status(200).json(new ApiResponse(200, {}, "Deleted"));
    } else {
      res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Config with this id not found"));
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getLocationStorage(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT attr_1 FROM config WHERE type = 'location_of_storage'`,
    );
    const data = rows.map((row) => row.attr_1);
    res.status(200).json(new ApiResponse(200, data, "All location of storage"));
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getIssueTo(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id,attr_1 FROM config WHERE type = 'issue'`,
    );
    const data = rows.map((row) => ({ name: row.attr_1, id: row.id }));
    res.status(200).json(new ApiResponse(200, data, "All Issue to:"));
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getConcurredBy(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, attr_1 FROM config WHERE type = 'concurred_by'`,
    );
    const data = rows.map((row) => ({ name: row.attr_1, id: row.id }));
    res.status(200).json(new ApiResponse(200, data, "All Concurred By List:"));
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getUserByServiceNo(req, res) {
  try {
    console.log("SERVICE NO HIT 👉", req.params.service_no);
    const { service_no } = req.params;
    const [rows] = await pool.query(
      `SELECT attr_1, attr_2 
       FROM config 
       WHERE type = 'service_no' AND attr_1 = ?`,
      [service_no],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Service number not found"));
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          service_no: rows[0].attr_1,
          name: rows[0].attr_2,
        },
        "User found",
      ),
    );
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  addConfig,
  getLocationStorage,
  getIssueTo,
  getConcurredBy,
  getUserByServiceNo,
  deleteConfig,
};
