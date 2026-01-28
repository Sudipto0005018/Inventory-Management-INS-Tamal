const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

const createTool = async (req, res) => {
  const {
    description,
    equipment_system,
    denos,
    obs_authorised,
    obs_held,
    b_d_authorised,
    category,
    box_no,
    item_distribution,
    storage_location,
    item_code,
    indian_pattern,
    remarks,
    oem,
    substitute_name,
    local_terminology,
    critical_tool,
  } = req.body;
  const department = req.department;
  try {
    if (!description || !equipment_system) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "All fields are required"));
    }

    const isCriticalTool = critical_tool === "yes" ? 1 : 0;
    const query = `
            INSERT INTO tools
                (description, equipment_system, denos, obs_authorised, obs_held, b_d_authorised, category, box_no, item_distribution, storage_location, item_code, indian_pattern, remarks, department, image, uid, oem, substitute_name, local_terminology)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
    const [result] = await pool.query(query, [
      description,
      equipment_system,
      denos || null,
      obs_authorised || null,
      obs_held || null,
      b_d_authorised || null,
      category || null,
      box_no || null,
      item_distribution || null,
      storage_location || null,
      item_code || null,
      indian_pattern || null,
      remarks || null,
      department.id,
      req.file?.filename || null,
      Date.now().toString(),
      oem || null,
      substitute_name || null,
      local_terminology || null,
      isCriticalTool,
    ]);
    if (result.length === 0) {
      return res
        .status(500)
        .json(new ApiErrorResponse(500, {}, "Tools creation failed"));
    }
    res
      .status(201)
      .json(new ApiResponse(201, result[0], "Tools created successfully"));
  } catch (error) {
    console.log("Error creating spare: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

async function getTools(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;

  try {
    let whereClause = "WHERE department = ?";
    let params = [department.id];
    if (search) {
      whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM tools ${whereClause}`,
      params
    );
    const totalSpares = totalCount[0].count;
    if (totalSpares === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
          },
          search ? "No matching tools found" : "No tools found"
        )
      );
    }

    const query = `
            SELECT * FROM tools ${whereClause}
            ORDER BY description ASC
            LIMIT ? OFFSET ?;
        `;
    const [rows] = await pool.query(query, [...params, limit, offset]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: totalSpares,
          totalPages: Math.ceil(totalSpares / limit),
          currentPage: page,
        },
        "Tools retrieved successfully"
      )
    );
  } catch (error) {
    console.log("Error while getting tools: ", error);
    res.status.json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getCriticalTools(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;

  try {
    let whereClause = "WHERE department = ? AND critical_tool = 1";
    let params = [department.id];
    if (search) {
      whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM tools ${whereClause}`,
      params,
    );
    const totalSpares = totalCount[0].count;
    if (totalSpares === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
          },
          search ? "No matching critical tools found" : "No critical tools found",
        ),
      );
    }

    const query = `
            SELECT * FROM tools ${whereClause}
            ORDER BY description ASC
            LIMIT ? OFFSET ?;
        `;
    const [rows] = await pool.query(query, [...params, limit, offset]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: totalSpares,
          totalPages: Math.ceil(totalSpares / limit),
          currentPage: page,
        },
        "Critical Tools retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error while getting critical tools: ", error);
    res.status.json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}
// async function updateTool(req, res) {
//   const { id } = req.params;
//   const {
//     description,
//     equipment_system,
//     denos,
//     obs_authorised,
//     obs_held,
//     b_d_authorised,
//     category,
//     box_no,
//     item_distribution,
//     storage_location,
//     item_code,
//     indian_pattern,
//     remarks,
//     image,
//     oem,
//     substitute_name,
//     local_terminology,
//   } = req.body;
//   let filename = null;
//   if (req.file) {
//     filename = req.file.filename;
//   } else if (image) {
//     filename = image;
//   }
//   if (!description || !equipment_system) {
//     return res
//       .status(400)
//       .json(new ApiErrorResponse(400, {}, "All fields are required"));
//   }
//   let oldImg = null;
//   try {
//     const [r] = await pool.query(
//       `SELECT obs_authorised, obs_authorised_new FROM tools WHERE id = ?`,
//       [id]
//     );
//     const data = r[0];
//     if (data.obs_authorised_new != null) {
      
//       return res
//         .status(400)
//         .json(new ApiErrorResponse(400, {}, "Approval pending"));
//     }
//     let query;
//     if (data.obs_authorised == obs_authorised) {
//       query = `
//         UPDATE tools
//         SET description = ?, equipment_system = ?, denos = ?, obs_authorised = ?, obs_held = ?, b_d_authorised = ?, category = ?, box_no = ?, item_distribution = ?, storage_location = ?, item_code = ?, indian_pattern = ?, remarks = ?, image = ?, oem = ?, substitute_name = ?, local_terminology = ?
//         WHERE id = ?;
//         `;
//     } else {
//       query = `
//         UPDATE tools
//         SET description = ?, equipment_system = ?, denos = ?, obs_authorised_new = ?, obs_held = ?, b_d_authorised = ?, category = ?, box_no = ?, item_distribution = ?, storage_location = ?, item_code = ?, indian_pattern = ?, remarks = ?, image = ?, oem = ?, substitute_name = ?, local_terminology = ?
//         WHERE id = ?;
//       `;
//     }

//     [oldImg] = await pool.query("SELECT image FROM tools WHERE id = ?", [id]);
//     const [result] = await pool.query(query, [
//       description,
//       equipment_system,
//       denos || null,
//       obs_authorised || null,
//       obs_held || null,
//       b_d_authorised || null,
//       category || null,
//       box_no || null,
//       item_distribution || null,
//       storage_location || null,
//       item_code || null,
//       indian_pattern || null,
//       remarks || null,
//       filename || null,
//       oem || null,
//       substitute_name || null,
//       local_terminology || null,
//       id,
//     ]);
//     if (result.affectedRows === 0) {
//       return res
//         .status(404)
//         .json(new ApiErrorResponse(404, {}, "Tool not found"));
//     }
//     res.status(200).json(new ApiResponse(200, {}, "Tool updated successfully"));
//   } catch (error) {
//     console.log("Error while updating tools: ", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   } finally {
//     if (req.file && oldImg[0].image) {
//       unlinkFile(oldImg[0].image);
//     }
//   }
// }

async function updateTool(req, res) {
  const { id } = req.params;

  const {
    description,
    equipment_system,
    denos,
    obs_authorised,
    obs_held,
    b_d_authorised,
    category,
    box_no,
    item_distribution,
    storage_location,
    item_code,
    indian_pattern,
    remarks,
    image,
    oem,
    substitute_name,
    local_terminology,
    critical_tool,
  } = req.body;

  const filename = req.file ? req.file.filename : image || null;
  const isCriticalTool = critical_tool === "yes" ? 1 : 0;

  if (!description || !equipment_system) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  let oldImg = null;

  try {
    /* 1️⃣ Fetch current spare */
    const [[tool]] = await pool.query(
      `SELECT obs_authorised, image FROM tools WHERE id = ?`,
      [id]
    );

    if (!tool) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool not found"));
    }

    /* 2️⃣ If obs_authorised changed → approval required */
    if (tool.obs_authorised != obs_authorised) {
      // Check pending approval
      const [[pending]] = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM approval
        WHERE tools_id = ?
          AND field_name = 'obs_authorised'
          AND status = 'pending'
        `,
        [id]
      );

      if (pending.count > 0) {
        return res
          .status(400)
          .json(new ApiErrorResponse(400, {}, "Approval already pending"));
      }

      // Insert approval request
      await pool.query(
        `
        INSERT INTO approval
          (tools_id, created_by, field_name, old_value, new_value, status)
        VALUES
          (?, ?, 'obs_authorised', ?, ?, 'pending')
        `,
        [id, req.user.id, tool.obs_authorised, obs_authorised]
      );
    }

    /* 3️⃣ Update NON-sensitive fields immediately */
    const [result] = await pool.query(
      `
      UPDATE tools
      SET description = ?,
          equipment_system = ?,
          denos = ?,
          obs_held = ?,
          b_d_authorised = ?,
          category = ?,
          box_no = ?,
          item_distribution = ?,
          storage_location = ?,
          item_code = ?,
          indian_pattern = ?,
          remarks = ?,
          image = ?,
          oem = ?,
          substitute_name = ?,
          local_terminology = ?,
          critical_tool = ?
      WHERE id = ?
      `,
      [
        description,
        equipment_system,
        denos || null,
        obs_held || null,
        b_d_authorised || null,
        category || null,
        box_no || null,
        item_distribution || null,
        storage_location || null,
        item_code || null,
        indian_pattern || null,
        remarks || null,
        filename,
        oem || null,
        substitute_name || null,
        local_terminology || null,
        isCriticalTool,
        id,
      ]
    );

    oldImg = tool.image;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          tool.obs_authorised != obs_authorised
            ? "Tool updated. Approval request sent."
            : "Tool updated successfully"
        )
      );
  } catch (error) {
    console.error("Error while updating tool:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  } finally {
    if (req.file && oldImg) {
      unlinkFile(oldImg);
    }
  }
}

async function deleteTool(req, res) {
  const { id } = req.params;
  try {
    const query = `
            DELETE FROM tools
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Tool deleted successfully"));
  } catch (error) {
    console.log("Error while deleting spare: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function approveObsAuth(req, res) {
  const { id } = req.params;
  try {
    const query = `
            SELECT obs_authorised, obs_authorised_new FROM tools WHERE id = ?
        `;
    const [r] = await pool.query(query, [id]);
    const tool = r[0];
    if (!tool.obs_authorised_new) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(400, {}, "Already approved or not requested")
        );
    }
    const [result] = await pool.query(
      `UPDATE tools SET obs_authorised = ?, obs_authorised_new = ? WHERE id = ?`,
      [tool.obs_authorised_new, null, id]
    );
    return res.status(200).json(new ApiResponse(200, result, "Approved"));
  } catch (error) {
    console.log("Error while approving obs authorised: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getOBSAuthApprovalPending(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) AS total FROM tools WHERE obs_authorised_new IS NOT NULL`
    );
    if (total[0].total == 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
          },
          "No product found"
        )
      );
    }
    const [rows] = await pool.query(
      `SELECT * FROM tools WHERE obs_authorised_new IS NOT NULL LIMIT ? OFFSET ?;`,
      [limit, offset]
    );
    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total[0].total,
          totalPages: Math.ceil(total[0].total / limit),
          currentPage: page,
        },
        "Tools retrieved successfully"
      )
    );
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function rejectObsAuth(req, res) {
  const { id } = req.params;

  try {
    const query = `
      SELECT obs_authorised, obs_authorised_new FROM tools WHERE id = ?
    `;
    const [r] = await pool.query(query, [id]);
    const tool = r[0];

    if (!tool || !tool.obs_authorised_new) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(400, {}, "Already rejected or not requested")
        );
    }

    const [result] = await pool.query(
      `UPDATE tools SET obs_authorised_new = ? WHERE id = ?`,
      [null, id]
    );

    return res.status(200).json(new ApiResponse(200, result, "Rejected"));
  } catch (error) {
    console.log("Error while rejecting obs authorised: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  createTool,
  getTools,
  updateTool,
  deleteTool,
  approveObsAuth,
  getOBSAuthApprovalPending,
  rejectObsAuth,
  getCriticalTools,
};
