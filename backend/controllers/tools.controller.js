const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { unlinkFile } = require("../middlewares/file");

const createTool = async (req, res) => {
  const {
    description,
    equipment_system,
    denos,
    obs_authorised,
    obs_maintained,
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
    sub_component,
    price_unit,
    supplier,
  } = req.body;
  const department = req.department;
  try {
    if (!description || !equipment_system) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "All fields are required"));
    }

    const isCriticalTool = critical_tool === "yes" ? 1 : 0;

    // ✅ MULTI IMAGE FILENAMES
    const images = req.files?.map((file) => file.filename) || [];

    const query = `
            INSERT INTO tools
                (description, equipment_system, denos, obs_authorised, obs_maintained, obs_held, b_d_authorised, category, box_no, item_distribution, storage_location, item_code, indian_pattern, remarks, department, images, uid, oem, substitute_name, local_terminology, critical_tool, sub_component, price_unit, supplier)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
    const [result] = await pool.query(query, [
      description,
      equipment_system,
      denos || null,
      obs_authorised || null,
      obs_maintained || null,
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
      JSON.stringify(images),
      Date.now().toString(),
      oem || null,
      substitute_name || null,
      local_terminology || null,
      isCriticalTool,
      sub_component || null,
      price_unit || null,
      supplier || null,
    ]);
    if (result.length === 0) {
      return res
        .status(500)
        .json(new ApiErrorResponse(500, {}, "Tools creation failed"));
    }
    res
      .status(201)
      .json(new ApiResponse(201, result, "Tools created successfully"));
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
          search ? "No matching tools found" : "No tools found",
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
        "Tools retrieved successfully",
      ),
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
  console.log("called");

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
          search
            ? "No matching critical tools found"
            : "No critical tools found",
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

async function updateTool(req, res) {
  const { id } = req.params;

  const {
    description,
    equipment_system,
    denos,
    obs_authorised,
    obs_maintained,
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
    sub_component,
    price_unit,
    supplier,
  } = req.body;

  // const filename = req.file ? req.file.filename : image || null;

  const imageStatus = req.body.imageStatus
    ? JSON.parse(req.body.imageStatus)
    : [];

  if (!description || !equipment_system) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  if (!description || !equipment_system) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  // let oldImg = null;

  try {
    /* 1️⃣ Fetch current spare */
    const [[tool]] = await pool.query(
      `SELECT obs_authorised, images FROM tools WHERE id = ?`,
      [id],
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
        [id],
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
        [id, req.user.id, tool.obs_authorised, obs_authorised],
      );
    }

    /* ---------------- SAFE OLD IMAGE PARSE ---------------- */

    let oldImages = [];

    if (tool.images) {
      try {
        const parsed =
          typeof tool.images === "string"
            ? JSON.parse(tool.images)
            : tool.images;

        if (Array.isArray(parsed)) {
          oldImages = parsed.filter(
            (img) =>
              img !== null &&
              img !== "null" &&
              img !== "" &&
              img !== "undefined",
          );
        } else {
          oldImages = [];
        }
      } catch (err) {
        console.log("Image JSON parse error:", err);
        oldImages = [];
      }
    }

    /* Ensure iterable ALWAYS */
    if (!Array.isArray(oldImages)) {
      oldImages = [];
    }

    /* Clone safely */
    let finalImages = [...oldImages];

    /* Build upload map by index */
    const uploadMap = {};

    if (req.files) {
      req.files.forEach((file) => {
        // frontend must send fieldname like images_0, images_1 etc
        const match = file.fieldname.match(/images_(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          uploadMap[index] = file.filename;
        }
      });
    }

    imageStatus.forEach((status, index) => {
      /* DELETE */
      if (status.isDeleted) {
        if (finalImages[index]) {
          unlinkFile(finalImages[index]);
        }
        finalImages[index] = null;
      }

      /* REPLACE */
      if (status.isReplaced) {
        if (finalImages[index]) {
          unlinkFile(finalImages[index]);
        }

        if (uploadMap[index]) {
          finalImages[index] = uploadMap[index];
        }
      }
    });

    /* Remove ALL null / empty slots */
    finalImages = finalImages.filter(
      (img) =>
        img !== null && img !== "" && img !== "null" && img !== "undefined",
    );

    /* Remove only trailing nulls */
    while (finalImages.length && finalImages[finalImages.length - 1] === null) {
      finalImages.pop();
    }

    console.log("REQ.FILES:", req.files);
    console.log("IMAGE STATUS:", imageStatus);
    console.log("OLD IMAGES:", oldImages);
    console.log("UPLOAD MAP:", uploadMap);
    console.log("FINAL IMAGES:", finalImages);

    /* 3️⃣ Update NON-sensitive fields immediately */
    const [result] = await pool.query(
      `
      UPDATE tools
      SET description = ?,
          equipment_system = ?,
          denos = ?,
          obs_held = ?,
          obs_maintained = ?,
          b_d_authorised = ?,
          category = ?,
          box_no = ?,
          item_distribution = ?,
          storage_location = ?,
          item_code = ?,
          indian_pattern = ?,
          remarks = ?,
          images = ?,
          oem = ?,
          substitute_name = ?,
          local_terminology = ?,
          critical_tool = ?,
          sub_component = ?,
          price_unit = ?,
          supplier = ?
      WHERE id = ?
      `,
      [
        description,
        equipment_system,
        denos || null,
        obs_held || null,
        obs_maintained || null,
        b_d_authorised || null,
        category || null,
        box_no || null,
        item_distribution || null,
        storage_location || null,
        item_code || null,
        indian_pattern || null,
        remarks || null,
        JSON.stringify(finalImages),
        oem || null,
        substitute_name || null,
        local_terminology || null,
        critical_tool,
        sub_component || null,
        price_unit || null,
        supplier || null,
        id,
      ],
    );

    const removeFiles = oldImages.filter((f) => !finalImages.includes(f));
    if (finalImages.length > 0) {
      for (let i = 0; i < removeFiles.length; i++) {
        unlinkFile(removeFiles[i]);
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          tool.obs_authorised != obs_authorised
            ? "Tool updated. Approval request sent."
            : "Tool updated successfully",
        ),
      );
  } catch (error) {
    console.error("Error while updating tool:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
  // finally {
  //   if (req.file && oldImg) {
  //     unlinkFile(oldImg);
  //   }
  // }
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
          new ApiErrorResponse(400, {}, "Already approved or not requested"),
        );
    }
    const [result] = await pool.query(
      `UPDATE tools SET obs_authorised = ?, obs_authorised_new = ? WHERE id = ?`,
      [tool.obs_authorised_new, null, id],
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
      `SELECT COUNT(*) AS total FROM tools WHERE obs_authorised_new IS NOT NULL`,
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
          "No product found",
        ),
      );
    }
    const [rows] = await pool.query(
      `SELECT * FROM tools WHERE obs_authorised_new IS NOT NULL LIMIT ? OFFSET ?;`,
      [limit, offset],
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
        "Tools retrieved successfully",
      ),
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
          new ApiErrorResponse(400, {}, "Already rejected or not requested"),
        );
    }

    const [result] = await pool.query(
      `UPDATE tools SET obs_authorised_new = ? WHERE id = ?`,
      [null, id],
    );

    return res.status(200).json(new ApiResponse(200, result, "Rejected"));
  } catch (error) {
    console.log("Error while rejecting obs authorised: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getLowStockTools(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;
  try {
    let whereClause = "WHERE obs_held <(SELECT COUNT(*) / 4 FROM tools)";
    let params = [];
    if (search) {
      whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM tools ${whereClause}`,
      params,
    );
    const totalTools = totalCount[0].count;

    if (totalTools === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
          },
          search ? "No matching tools found" : "No tool found",
        ),
      );
    }
    const [rows] = await pool.query(
      `SELECT * FROM tools ${whereClause}
            ORDER BY description ASC
            LIMIT ? OFFSET ?;
        `,
      [...params, limit, offset],
    );
    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalTools,
        totalPages: Math.ceil(totalTools / limit),
        currentPage: page,
      },
      "Low stock tools",
    ).send(res);
  } catch (error) {
    console.log(error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
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
  getLowStockTools,
};
