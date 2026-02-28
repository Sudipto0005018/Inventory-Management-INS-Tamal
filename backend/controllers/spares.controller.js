const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { unlinkFile } = require("../middlewares/file");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const ALLOWED_SEARCH_FIELDS = [
  "description",
  "equipment_system",
  "denos",
  "obs_authorised",
  "obs_maintained",
  "obs_held",
  "boxNo",
  "storage_location",
  "item_distribution",
  "indian_pattern",
  "item_code",
  "price_unit",
  "sub_component",
  "category",
];

async function getSpares(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = (req.query?.search || "").trim();
  // new: comma-separated or JSON array of fields
  let searchFieldsRaw = req.query?.searchFields || "";
  let searchFields = [];

  if (searchFieldsRaw) {
    try {
      if (searchFieldsRaw.startsWith("[")) {
        searchFields = JSON.parse(searchFieldsRaw);
      } else {
        searchFields = searchFieldsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch (e) {
      searchFields = [];
    }
  }

  // sanitize/validate fields, fallback to default fields when none provided
  const validFields = searchFields.length
    ? searchFields.filter((f) => ALLOWED_SEARCH_FIELDS.includes(f))
    : [
        "description",
        "equipment_system",
        "denos",
        "indian_pattern",
        "item_code",
        "category",
      ];

  const offset = (page - 1) * limit;
  const department = req.department;

  try {
    // base where
    let whereClause = "WHERE department = ?";
    let params = [department.id];

    if (search) {
      // Split search by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((w) => w.trim())
        .filter(Boolean);

      let wordConditions = [];

      for (const word of searchWords) {
        let fieldFragments = [];

        for (const field of validFields) {
          // Numeric fields detection
          if (
            [
              "obs_authorised",
              "obs_maintained",
              "obs_held",
              "price_unit",
            ].includes(field) &&
            !isNaN(word)
          ) {
            params.push(Number(word));
            fieldFragments.push(`${field} = ?`);
          } else {
            params.push(`%${word}%`);
            fieldFragments.push(`${field} LIKE ?`);
          }
        }

        // Each word must match at least one field (OR)
        wordConditions.push(`(${fieldFragments.join(" OR ")})`);
      }

      // All words must match (AND)
      whereClause += ` AND (${wordConditions.join(" AND ")})`;
    }

    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM spares ${whereClause}`,
      params,
    );
    const totalSpares = totalCount[0].count;

    if (totalSpares === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { items: [], totalItems: 0, totalPages: 1, currentPage: page },
            search ? "No matching spares found" : "No spare found",
          ),
        );
    }

    const query = `
      SELECT *, 'spare' AS source FROM spares
      ${whereClause}
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
        "Spares retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

const createSpare = async (req, res) => {
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
    critical_spare,
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

    const isCriticalSpare = critical_spare === "yes" ? 1 : 0;

    // ✅ MULTI IMAGE FILENAMES
    const images = req.files?.map((file) => file.filename) || [];

    const query = `
            INSERT INTO spares
                (description, equipment_system, denos, obs_authorised, obs_maintained, obs_held, b_d_authorised, category, box_no, item_distribution, storage_location, item_code, indian_pattern, remarks, department, images, uid, oem, substitute_name, local_terminology, critical_spare, sub_component, price_unit, supplier)
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
      isCriticalSpare,
      sub_component || null,
      price_unit || null,
      supplier || null,
    ]);

    res
      .status(201)
      .json(new ApiResponse(201, result, "Spare created successfully")); //result[0]
  } catch (error) {
    console.log("Error creating spare: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

//update special demand
async function updateSpecialDemand(req, res) {
  try {
    const {
      id,
      obs_authorised,
      obs_increase_qty,
      internal_demand_no,
      internal_demand_date,
      requisition_no,
      requisition_date,
      mo_demand_no,
      mo_demand_date,
    } = req.body;

    if (!id) {
      return res.status(400).json(
        new ApiErrorResponse({
          success: false,
          message: "Item ID is required",
        }),
      );
    }

    const query = `
      UPDATE spares
      SET
        obs_authorised = ?,
        obs_increase_qty = ?,
        internal_demand_no = ?,
        internal_demand_date = ?,
        requisition_no = ?,
        requisition_date = ?,
        mo_demand_no = ?,
        mo_demand_date = ?,
        status = 'demanded'
      WHERE id = ?
    `;

    await db.query(query, [
      obs_authorised,
      obs_increase_qty,
      internal_demand_no || null,
      internal_demand_date || null,
      requisition_no || null,
      requisition_date || null,
      mo_demand_no || null,
      mo_demand_date || null,
      id,
    ]);

    //a defensive fall back
    // await db.query(query, [
    //   obs_authorised ?? 0,
    //   obs_increase_qty ?? 0,
    //   internal_demand_no || null,
    //   internal_demand_date || null,
    //   requisition_no || null,
    //   requisition_date || null,
    //   mo_demand_no || null,
    //   mo_demand_date || null,
    //   id,
    // ]);

    res.json(
      new ApiResponse({
        success: true,
        message: "Special Demand updated successfully",
      }),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(
      new ApiErrorResponse({
        success: false,
        message: "Failed to update Special Demand",
      }),
    );
  }
}

// async function getSpares(req, res) {
//   const page = parseInt(req.query?.page) || 1;
//   const limit = parseInt(req.query?.limit) || 10;
//   const search = req.query?.search || "";
//   const offset = (page - 1) * limit;
//   const department = req.department;

//   try {
//     let whereClause = "WHERE department = ?";
//     let params = [department.id];
//     if (search) {
//       whereClause +=
//         " AND (description LIKE ? OR equipment_system LIKE ? OR obs_authorised LIKE ?)";
//       params.push(`%${search}%`, `%${search}%`);
//     }
//     const [totalCount] = await pool.query(
//       `SELECT COUNT(*) as count FROM spares ${whereClause}`,
//       params,
//     );
//     const totalSpares = totalCount[0].count;
//     if (totalSpares === 0) {
//       return res.status(200).json(
//         new ApiResponse(
//           200,
//           {
//             items: [],
//             totalItems: 0,
//             totalPages: 1,
//             currentPage: page,
//           },
//           search ? "No matching spares found" : "No spare found",
//         ),
//       );
//     }

//     const query = `
//             SELECT *, 'spare' AS source FROM spares
//             ${whereClause}
//             ORDER BY description ASC
//             LIMIT ? OFFSET ?;
//         `;
//     const [rows] = await pool.query(query, [...params, limit, offset]);
//     res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           items: rows,
//           totalItems: totalSpares,
//           totalPages: Math.ceil(totalSpares / limit),
//           currentPage: page,
//         },
//         "Spares retrieved successfully",
//       ),
//     );
//   } catch (error) {
//     console.log("Error while getting spares: ", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// }

async function getCriticalSpares(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;

  try {
    let whereClause = "WHERE department = ? AND critical_spare = 1";
    let params = [department.id];

    if (search) {
      const searchableFields = [
        "description",
        "equipment_system",
        "category",
        "indian_pattern",
        "denos",
        "obs_authorised",
        "obs_maintained",
        "obs_held",
        "storage_location",
      ];

      // Split by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((w) => w.trim())
        .filter(Boolean);

      let wordConditions = [];

      for (const word of searchWords) {
        let fieldFragments = [];

        for (const field of searchableFields) {
          params.push(`%${word}%`);
          fieldFragments.push(`${field} LIKE ?`);
        }

        // Each word must match at least one column
        wordConditions.push(`(${fieldFragments.join(" OR ")})`);
      }

      // All words must match
      whereClause += ` AND (${wordConditions.join(" AND ")})`;
    }

    /* total count */
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) AS count FROM spares ${whereClause}`,
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
            ? "No matching critical spares found"
            : "No critical spares found",
        ),
      );
    }

    /* fetch paginated data */
    const [rows] = await pool.query(
      `
      SELECT *
      FROM spares
      ${whereClause}
      ORDER BY description ASC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: totalSpares,
          totalPages: Math.ceil(totalSpares / limit),
          currentPage: page,
        },
        "Critical spares retrieved successfully",
      ),
    );
  } catch (error) {
    console.error("Error while getting critical spares:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function updateSpare(req, res) {
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
    critical_spare,
    sub_component,
    price_unit,
    supplier,
  } = req.body;

  // const filename = req.file ? req.file.filename : image || null;

  // const newImages = req.files?.map((f) => f.filename) || [];

  const imageStatus = req.body.imageStatus
    ? JSON.parse(req.body.imageStatus)
    : [];

  if (!description || !equipment_system) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  // let oldImg = null;

  try {
    /* 1️⃣ Fetch current spare */
    const [[spare]] = await pool.query(
      `SELECT obs_authorised, images FROM spares WHERE id = ?`,
      [id],
    );

    if (!spare) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Spare not found"));
    }

    /* 2️⃣ If obs_authorised changed → approval required */
    if (spare.obs_authorised != obs_authorised) {
      // Check pending approval
      const [[pending]] = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM approval
        WHERE spares_id = ?
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
          (spares_id, created_by, field_name, old_value, new_value, status)
        VALUES
          (?, ?, 'obs_authorised', ?, ?, 'pending')
        `,
        [id, req.user.id, spare.obs_authorised, obs_authorised],
      );
    }

    /* ---------------- SAFE OLD IMAGE PARSE ---------------- */

    let oldImages = [];

    if (spare.images) {
      try {
        const parsed =
          typeof spare.images === "string"
            ? JSON.parse(spare.images)
            : spare.images;

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

    console.log(obs_maintained);
    await pool.query(
      `
      UPDATE spares
      SET description = ?,
          equipment_system = ?,
          denos = ?,
          obs_held = ?,
          b_d_authorised = ?,
          obs_maintained = ?,
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
          critical_spare = ?,
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
        b_d_authorised || null,
        obs_maintained || null,
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
        critical_spare,
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

    //alternative way without using middleware file.js
    // const imageFolder = path.join(__dirname, "../uploads");
    // const removeFiles = oldImages.filter((f) => !finalImages.includes(f));
    // if (finalImages.length > 0) {
    //   for (let i = 0; i < removeFiles.length; i++) {
    //     const filePath = path.join(imageFolder, removeFiles[i]);
    //     try {
    //       fs.unlinkSync(filePath);
    //     } catch (error) {}
    //   }
    // }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          spare.obs_authorised != obs_authorised
            ? "Spare updated. Approval request sent."
            : "Spare updated successfully",
        ),
      );
  } catch (error) {
    console.error("Error while updating spare:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function deleteSpare(req, res) {
  const { id } = req.params;
  try {
    const query = `
            DELETE FROM spares
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Spare not found"));
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Spare deleted successfully"));
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
            SELECT obs_authorised, obs_authorised_new FROM spares WHERE id = ?
        `;
    const [r] = await pool.query(query, [id]);
    const spare = r[0];
    if (!spare.obs_authorised_new) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(400, {}, "Already approved or not requested"),
        );
    }
    const [result] = await pool.query(
      `UPDATE spares SET obs_authorised = ?, obs_authorised_new = ? WHERE id = ?`,
      [spare.obs_authorised_new, null, id],
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
      `SELECT COUNT(*) AS total FROM spares WHERE obs_authorised_new IS NOT NULL`,
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
      `SELECT * FROM spares WHERE obs_authorised_new IS NOT NULL LIMIT ? OFFSET ?;`,
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
      SELECT obs_authorised, obs_authorised_new FROM spares WHERE id = ?
    `;
    const [r] = await pool.query(query, [id]);
    const spare = r[0];

    if (!spare || !spare.obs_authorised_new) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(400, {}, "Already rejected or not requested"),
        );
    }

    const [result] = await pool.query(
      `UPDATE spares SET obs_authorised_new = ? WHERE id = ?`,
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

async function getAllApprovalPendings(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) AS total
        FROM (
            SELECT id
            FROM tools
            WHERE obs_authorised_new IS NOT NULL

            UNION ALL

            SELECT id
            FROM spares
            WHERE obs_authorised_new IS NOT NULL
        ) AS combined;`,
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
      `SELECT *, 'tools' AS source
        FROM tools
        WHERE obs_authorised_new IS NOT NULL

        UNION ALL

        SELECT *, 'spares' AS source
        FROM spares
        WHERE obs_authorised_new IS NOT NULL

        LIMIT ? OFFSET ?;`,
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

async function generateQRCode(req, res) {
  const { tool_id, spare_id, copy_count, box_no } = req.body;
  console.log("req.body", req.body);
  const PDFDocument = require("pdfkit");
  const qr = require("qrcode");

  try {
    const doc = new PDFDocument({
      size: [50 * 2.83465, 25 * 2.83465], // 50mm x 25mm
      margins: { top: 0, left: 0, right: 0, bottom: 0 },
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="qrcodes_${Date.now()}.pdf"`,
      );
      res.send(pdfData);
    });

    let data = null;
    if (tool_id) {
      const [rows] = await pool.query(
        "SELECT description,indian_pattern,uid,equipment_system FROM tools WHERE id = ?",
        [tool_id],
      );
      data = rows[0];
    } else {
      const [rows] = await pool.query(
        "SELECT description,indian_pattern,uid,equipment_system FROM spares WHERE id = ?",
        [spare_id],
      );
      data = rows[0];
    }

    const qrText = `${data.description}|${data.indian_pattern}|${data.uid}|${data.equipment_system}|${box_no}`;
    const qrURL = await qr.toDataURL(qrText, { margin: 0, width: 120 });
    for (let i = 0; i < copy_count; i++) {
      if (i > 0) doc.addPage();
      doc.image(qrURL, 5, 5, { width: 50, height: 50 });
      doc.fontSize(8).text(data.description, 60, 5, { width: 100 });
      doc.fontSize(8).text(data.indian_pattern, 60, 15, { width: 100 });
      doc.fontSize(8).text(data.uid, 60, 25, { width: 100 });
      doc.fontSize(8).text(data.equipment_system, 60, 35, { width: 100 });
      doc.fontSize(8).text(box_no, 60, 45, { width: 100 });
    }
    doc.end();
  } catch (error) {
    console.log("Error while generating QR code: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function generateExcel(req, res) {
  let { module, completed, startDate, endDate } = req.query;
  console.log(req.query);
  if (completed && completed == "true") {
    completed = true;
  } else {
    completed = false;
  }

  try {
    let rows = [];

    if (module === "tools") {
      [rows] = await pool.query(`
        SELECT description, indian_pattern, equipment_system, category, denos,
        obs_authorised, obs_maintained, obs_held, box_no, item_distribution, storage_location
        FROM tools
      `);
    }

    if (module === "spares") {
      [rows] = await pool.query(`
        SELECT description, indian_pattern, equipment_system, category, denos,
        obs_authorised, obs_maintained, obs_held, box_no, item_distribution, storage_location
        FROM spares
      `);
    }

    if (module === "procurement") {
      const whereClause = completed
        ? `WHERE p.status = 'complete'
       AND p.created_at BETWEEN ? AND ?`
        : `WHERE (p.status = 'pending' OR p.status = 'partial')`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
      SELECT p.nac_qty, p.nac_no, p.nac_date, p.validity, p.rate_unit, p.issue_date,
      p.qty_received, p.box_no, p.created_at, p.status,

      COALESCE(sp.description, t.description) AS description,
      COALESCE(sp.category, t.category) AS category,
      COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
      COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,
        CASE
           WHEN p.spare_id IS NOT NULL THEN 'spare'
           WHEN p.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

        'PROCUREMENT' AS source,
       CASE
          WHEN pi.mo_no IS NOT NULL AND pi.mo_no != ''
          THEN pi.mo_no
          ELSE pi.demand_no
        END AS demand_no,

        CASE
          WHEN pi.mo_date IS NOT NULL
          THEN pi.mo_date
          ELSE pi.demand_date
        END AS demand_date,

        pi.demand_quantity

      FROM procurement p
      LEFT JOIN spares sp ON p.spare_id = sp.id
      LEFT JOIN tools t ON p.tool_id = t.id
      LEFT JOIN pending_issue pi ON p.issue_id = pi.id
       ${whereClause}
      ORDER BY p.created_at DESC
      `,
        args,
      );
    }

    if (module === "stock_update") {
      const whereClause = completed
        ? `WHERE s.status = 'complete'
       AND s.created_at BETWEEN ? AND ?`
        : `WHERE (s.status = 'pending' OR s.status = 'partial')`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
        SELECT s.stocked_in_qty, s.mo_no, s.mo_date, s.issue_date,
        s.box_no, s.qty_received, s.created_at, s.status,
          CASE
           WHEN s.spare_id IS NOT NULL THEN 'spare'
           WHEN s.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,
      COALESCE(sp.description, t.description) AS description,
      COALESCE(sp.category, t.category) AS category,
      COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
      COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,

        'STOCK_UPDATE' AS source,
        CASE
          WHEN pi.mo_no IS NOT NULL AND pi.mo_no != ''
          THEN pi.mo_no
          ELSE pi.demand_no
        END AS demand_no,

        CASE
          WHEN pi.mo_date IS NOT NULL
          THEN pi.mo_date
          ELSE pi.demand_date
        END AS demand_date,

        pi.demand_quantity

      FROM stock_update s
      LEFT JOIN spares sp ON s.spare_id = sp.id
      LEFT JOIN tools t ON s.tool_id = t.id
      LEFT JOIN pending_issue pi ON s.issued_id = pi.id
      ${whereClause}
      ORDER BY s.created_at DESC
      `,
        args,
      );
    }

    if (module === "survey") {
      const whereClause = completed
        ? `WHERE s.status = 'complete'
       AND s.created_at BETWEEN ? AND ?`
        : `WHERE s.status = 'pending'`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
    SELECT 
      s.issue_to,
      s.survey_quantity,
      s.withdrawl_qty,
      s.withdrawl_date,
      s.service_no,
      s.name,
      s.box_no,
      s.created_at,
      s.status,
        CASE
           WHEN s.spare_id IS NOT NULL THEN 'spare'
           WHEN s.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

      COALESCE(sp.description, t.description) AS description,
      COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
      COALESCE(sp.category, t.category) AS category,
      COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern

    FROM survey s
    LEFT JOIN spares sp ON s.spare_id = sp.id
    LEFT JOIN tools t ON s.tool_id = t.id
    ${whereClause}
    ORDER BY s.created_at DESC
  `,
        args,
      );
    }

    if (module === "demand") {
      const whereClause = completed
        ? `WHERE d.status = 'complete'
       AND d.created_at BETWEEN ? AND ?`
        : `WHERE d.status = 'pending'`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
    SELECT 
      d.issue_to,
      d.survey_qty,
      d.survey_voucher_no,
      d.survey_date,
      d.created_at,
      d.status, 
          CASE
           WHEN d.spare_id IS NOT NULL THEN 'spare'
           WHEN d.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,
      COALESCE(sp.description, t.description) AS description,
      COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
      COALESCE(sp.category, t.category) AS category,
      COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern

    FROM demand d
    LEFT JOIN spares sp ON d.spare_id = sp.id
    LEFT JOIN tools t ON d.tool_id = t.id
    ${whereClause}
    ORDER BY d.created_at DESC
  `,
        args,
      );
    }

    if (module === "issue") {
      const whereClause = completed
        ? `WHERE pi.status = 'complete'
       AND pi.created_at BETWEEN ? AND ?`
        : `WHERE (pi.status = 'pending' OR pi.status = 'partial')`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
    SELECT 
      pi.stocked_nac_qty,
      pi.quote_authority,
      COALESCE(sp.box_no, t.box_no) AS box_no,
      pi.demand_no,
      pi.demand_date,
      pi.requisition_no,
      pi.requisition_date,
      pi.mo_no,
      pi.mo_date,
      pi.demand_quantity,
      pi.qty_received,
      pi.return_date,
      pi.created_at,
      pi.status,
          CASE
           WHEN pi.spare_id IS NOT NULL THEN 'spare'
           WHEN pi.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

      COALESCE(sp.description, t.description) AS description,
      COALESCE(sp.category, t.category) AS category,
      COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
      COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern

    FROM pending_issue pi
    LEFT JOIN spares sp ON pi.spare_id = sp.id
    LEFT JOIN tools t ON pi.tool_id = t.id
    ${whereClause}
    ORDER BY pi.created_at DESC
  `,
        args,
      );

      rows = rows.map((row) => {
        let boxNo = [];

        if (row.box_no) {
          if (typeof row.box_no === "string") {
            try {
              const parsed = JSON.parse(row.box_no);

              if (Array.isArray(parsed)) {
                boxNo = parsed.map((b) => `${b.no} (${b.qn})`).join(", ");
              } else {
                boxNo = row.box_no;
              }
            } catch {
              boxNo = row.box_no;
            }
          } else if (Array.isArray(row.box_no)) {
            boxNo = row.box_no.map((b) => `${b.no} (${b.qn})`).join(", ");
          } else {
            boxNo = row.box_no;
          }
        }

        return {
          ...row,
          box_no: boxNo || "—",
        };
      });
    }

    if (module === "special_demand") {
      const whereClause = completed
        ? "WHERE (sd.internal_demand_no IS NOT NULL AND sd.requisition_no IS NOT NULL AND sd.mo_demand_no IS NOT NULL) AND sd.created_at BETWEEN ? AND ?"
        : "WHERE sd.internal_demand_no IS NULL OR sd.requisition_no IS NULL OR sd.mo_demand_no IS NULL";
      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
      SELECT 
          sd.obs_authorised,
          sd.obs_increase_qty,
          sd.quote_authority,
          sd.internal_demand_no,
          sd.internal_demand_date,
          sd.requisition_no,
          sd.requisition_date,
          sd.mo_demand_no,
          sd.mo_demand_date,

          sd.created_by_name,
          sd.created_at,

          CASE
           WHEN sd.spare_id IS NOT NULL THEN 'spare'
           WHEN sd.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.description
            WHEN sd.tool_id IS NOT NULL THEN t.description
            ELSE NULL
          END AS description,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.indian_pattern
            WHEN sd.tool_id IS NOT NULL THEN t.indian_pattern
            ELSE NULL
          END AS indian_pattern,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.category
            WHEN sd.tool_id IS NOT NULL THEN t.category
            ELSE NULL
          END AS category


    FROM special_demand sd
        LEFT JOIN spares s ON s.id = sd.spare_id
        LEFT JOIN tools t on t.id = sd.tool_id
      ${whereClause}
      ORDER BY sd.created_at DESC
  `,
        args,
      );
    }

    if (module === "ty") {
      const whereClause = completed
        ? `WHERE ty.status = 'complete'
       AND ty.created_at BETWEEN ? AND ?`
        : `WHERE (ty.status = 'pending' OR ty.status = 'partial' OR ty.status = 'overdue')`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
    SELECT 
        ty.qty_withdrawn,
        ty.qty_received,
        ty.service_no,
        ty.concurred_by,
        ty.issue_date,
        ty.loan_duration,
        ty.return_date,
        u1.name AS created_by_name,
        ty.created_at,

        u2.name AS approved_by_name,
        ty.approved_at,
        ty.box_no,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN 'spare'
          WHEN ty.tool_id IS NOT NULL THEN 'tool'
          ELSE 'unknown'
        END AS source,

        CASE
           WHEN ty.spare_id IS NOT NULL THEN 'spare'
           WHEN ty.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
        END AS type,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN s.description
          WHEN ty.tool_id IS NOT NULL THEN t.description
        END AS description,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN s.indian_pattern
          WHEN ty.tool_id IS NOT NULL THEN t.indian_pattern
        END AS indian_pattern,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN s.category
          WHEN ty.tool_id IS NOT NULL THEN t.category
        END AS category,

        CASE
          WHEN ty.status IN ('pending','partial')
          AND DATE_ADD(ty.issue_date, INTERVAL ty.loan_duration DAY) < CURDATE()
          THEN 'overdue'
          ELSE ty.status
        END AS loan_status,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN s.days_untill_return
          WHEN ty.tool_id IS NOT NULL THEN t.days_untill_return
        END AS days_untill_return

      FROM ty_loan ty
      LEFT JOIN spares s ON s.id = ty.spare_id
      LEFT JOIN tools t ON t.id = ty.tool_id
      LEFT JOIN users u1 ON u1.id = ty.created_by
      LEFT JOIN users u2 ON u2.id = ty.approved_by

      ${whereClause}
      ORDER BY ty.created_at DESC
  `,
        args,
      );
    }

    if (module === "temp") {
      const whereClause = completed
        ? `WHERE (til.status = 'complete' OR til.status = 'utilised')
       AND til.created_at BETWEEN ? AND ?`
        : `WHERE (til.status = 'pending' OR til.status = 'partial' OR til.status = 'overdue')`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
    SELECT 
    til.qty_withdrawn,
    til.qty_received,
    til.service_no,
    til.issue_to,
    til.issue_date,
    til.loan_duration,
    til.return_date,
    u1.name AS created_by_name,
    til.created_at,
    u2.name AS approved_by_name,
    til.approved_at,

    til.box_no,

    CASE
      WHEN til.spare_id IS NOT NULL THEN 'spare'
      WHEN til.tool_id IS NOT NULL THEN 'tool'
      ELSE 'unknown'
    END AS source,

      CASE
           WHEN til.spare_id IS NOT NULL THEN 'spare'
           WHEN til.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
      END AS type,

    CASE
      WHEN til.spare_id IS NOT NULL THEN s.description
      WHEN til.tool_id IS NOT NULL THEN t.description
    END AS description,

    CASE
      WHEN til.spare_id IS NOT NULL THEN s.indian_pattern
      WHEN til.tool_id IS NOT NULL THEN t.indian_pattern
    END AS indian_pattern,

    CASE
      WHEN til.spare_id IS NOT NULL THEN s.category
      WHEN til.tool_id IS NOT NULL THEN t.category
    END AS category,

            CASE
          WHEN til.spare_id IS NOT NULL THEN s.equipment_system
          WHEN til.tool_id IS NOT NULL THEN t.equipment_system
          ELSE NULL
        END AS equipment_system,

    CASE
      WHEN til.status IN ('pending','partial')
      AND DATE_ADD(til.issue_date, INTERVAL til.loan_duration DAY) < CURDATE()
      THEN 'overdue'
      ELSE til.status
    END AS loan_status,

    CASE
      WHEN til.spare_id IS NOT NULL THEN s.days_untill_return
      WHEN til.tool_id IS NOT NULL THEN t.days_untill_return
    END AS days_untill_return

FROM temporary_issue_local til
LEFT JOIN spares s ON s.id = til.spare_id
LEFT JOIN tools t ON t.id = til.tool_id
LEFT JOIN users u1 ON u1.id = til.created_by
LEFT JOIN users u2 ON u2.id = til.approved_by

${whereClause}
ORDER BY til.created_at DESC;
`,
        args,
      );
    }

    if (module === "docIssue") {
      const whereClause = completed
        ? `WHERE di.qty_received IS NOT NULL
       AND di.qty_received >= di.qty_withdrawn
       AND di.created_at BETWEEN ? AND ?`
        : `WHERE (
          di.qty_received IS NULL
          OR di.qty_received < di.qty_withdrawn
        )`;

      const args = completed ? [startDate, endDate] : [];

      [rows] = await pool.query(
        `
    SELECT 
        dc.description,
        dc.indian_pattern,
        dc.category,
        dc.folder_no,
        dc.box_no,
        dc.equipment_system,

        di.qty_withdrawn,
        di.qty_received,
        di.service_no,
        di.concurred_by,
        di.issue_to,
        di.issue_date,
        di.loan_duration,
        di.return_date,

        di.created_by,
        u1.name AS created_by_name,
        di.created_at,
        di.status,

        di.approved_by,
        u2.name AS approved_by_name,
        di.approved_at

    FROM doc_issue di
    LEFT JOIN doc_corner dc ON dc.id = di.doc_id
    LEFT JOIN users u1 ON u1.id = di.created_by
    LEFT JOIN users u2 ON u2.id = di.approved_by

    ${whereClause}
    ORDER BY di.created_at DESC
    `,
        args,
      );
    }

    if (module === "docCorner") {
      [rows] = await pool.query(`
    SELECT 
      description,
      indian_pattern,
      category,
      folder_no,
      box_no,
      equipment_system,
      item_code,
      item_distribution,
      created_at,
      updated_at
    FROM doc_corner
    ORDER BY description ASC
  `);
    }

    if (module === "d787") {
      [rows] = await pool.query(
        `
      SELECT 
          sd.obs_authorised,
          sd.created_by_name,
          sd.created_at,

          CASE
           WHEN sd.spare_id IS NOT NULL THEN 'spare'
           WHEN sd.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.description
            WHEN sd.tool_id IS NOT NULL THEN t.description
            ELSE NULL
          END AS description,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.indian_pattern
            WHEN sd.tool_id IS NOT NULL THEN t.indian_pattern
            ELSE NULL
          END AS indian_pattern,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.category
            WHEN sd.tool_id IS NOT NULL THEN t.category
            ELSE NULL
          END AS category,

          
          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.equipment_system
            WHEN sd.tool_id IS NOT NULL THEN t.equipment_system
            ELSE NULL
          END AS equipment_system

    FROM d787_special_demand sd
        LEFT JOIN spares s ON s.id = sd.spare_id
        LEFT JOIN tools t on t.id = sd.tool_id
      ORDER BY sd.created_at DESC
  `,
      );
    }

    if (module === "d787_amendment") {
      const whereClause = completed
        ? "WHERE (sd.internal_demand_no IS NOT NULL AND sd.requisition_no IS NOT NULL AND sd.mo_demand_no IS NOT NULL) AND sd.created_at BETWEEN ? AND ?"
        : "WHERE sd.internal_demand_no IS NULL OR sd.requisition_no IS NULL OR sd.mo_demand_no IS NULL";
      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
      SELECT 
          sd.obs_authorised,
          sd.obs_increase_qty,
          sd.quote_authority,
          sd.internal_demand_no,
          sd.internal_demand_date,
          sd.requisition_no,
          sd.requisition_date,
          sd.mo_demand_no,
          sd.mo_demand_date,

          sd.created_by_name,
          sd.created_at,

          CASE
           WHEN sd.spare_id IS NOT NULL THEN 'spare'
           WHEN sd.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.description
            WHEN sd.tool_id IS NOT NULL THEN t.description
            ELSE NULL
          END AS description,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.indian_pattern
            WHEN sd.tool_id IS NOT NULL THEN t.indian_pattern
            ELSE NULL
          END AS indian_pattern,

          CASE
            WHEN sd.spare_id IS NOT NULL THEN s.category
            WHEN sd.tool_id IS NOT NULL THEN t.category
            ELSE NULL
          END AS category


    FROM special_demand sd
        LEFT JOIN spares s ON s.id = sd.spare_id
        LEFT JOIN tools t on t.id = sd.tool_id
      ${whereClause}
      ORDER BY sd.created_at DESC
  `,
        args,
      );
    }

    if (module === "nac") {
      const whereClause = completed
        ? `WHERE p.status = 'complete'
       AND p.created_at BETWEEN ? AND ?`
        : `WHERE (p.status = 'pending' OR p.status = 'partial')`;

      const args = completed ? [startDate, endDate] : [];
      [rows] = await pool.query(
        `
      SELECT p.nac_qty, p.nac_no, p.nac_date, p.validity, p.rate_unit, p.issue_date,
      p.qty_received, p.box_no, p.created_at, p.status,

      COALESCE(sp.description, t.description) AS description,
      COALESCE(sp.category, t.category) AS category,
      COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
      COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,

        CASE
           WHEN p.spare_id IS NOT NULL THEN 'spare'
           WHEN p.tool_id IS NOT NULL THEN 'tool'
           ELSE NULL
          END AS type,

        'PROCUREMENT' AS source,
        pi.demand_no,
        pi.demand_date,
        pi.demand_quantity

      FROM procurement p
      LEFT JOIN spares sp ON p.spare_id = sp.id
      LEFT JOIN tools t ON p.tool_id = t.id
      LEFT JOIN pending_issue pi ON p.issue_id = pi.id
       ${whereClause}
      ORDER BY p.created_at DESC
      `,
        args,
      );
    }

    // Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(module);
    const {
      spares: spareHeaders,
      procurement: procurementHeaders,
      tools: toolHeaders,
      stock_update: stockHeaders,
      survey: surveyHeaders,
      demand: demandHeaders,
      issue: issueHeaders,
      special_demand: specialDHeaders,
      ty: tyHeaders,
      temp: tempHeaders,
      docIssue: docIssueHeaders,
      docCorner: docCornerHeaders,
      d787: D787Headers,
      d787_amendment: D787AmendHeaders,
      nac: NACHeaders,
    } = require("../utils/workbookHeaderas");

    if (module === "procurement") {
      worksheet.columns = procurementHeaders;
    } else if (module === "spares") {
      worksheet.columns = spareHeaders;
    } else if (module === "tools") {
      worksheet.columns = toolHeaders;
    } else if (module === "stock_update") {
      worksheet.columns = stockHeaders;
    } else if (module === "survey") {
      worksheet.columns = surveyHeaders;
    } else if (module === "demand") {
      worksheet.columns = demandHeaders;
    } else if (module === "issue") {
      worksheet.columns = issueHeaders;
    } else if (module === "special_demand") {
      worksheet.columns = specialDHeaders;
    } else if (module === "ty") {
      worksheet.columns = tyHeaders;
    } else if (module === "temp") {
      worksheet.columns = tempHeaders;
    } else if (module === "docIssue") {
      worksheet.columns = docIssueHeaders;
    } else if (module === "docCorner") {
      worksheet.columns = docCornerHeaders;
    } else if (module === "d787") {
      worksheet.columns = D787Headers;
    } else if (module === "d787_amndment") {
      worksheet.columns = D787AmendHeaders;
    } else if (module === "nac") {
      worksheet.columns = NACHeaders;
    }

    rows.forEach((row) => {
      let boxNo = [];

      if (row.box_no) {
        try {
          boxNo =
            typeof row.box_no === "string"
              ? JSON.parse(row.box_no)
              : row.box_no;
        } catch {
          boxNo = [];
        }
      }

      row.boxes = boxNo.map((box) => box.no).join(", ");

      row.itemDistribution = boxNo
        .map((box) => box.qtyHeld || box.qn || "")
        .join(", ");

      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.set({
      "Content-Length": buffer.length,
      "Content-Disposition": `attachment; filename=${module}_${Date.now()}.xlsx`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    res.send(buffer);
    // const fs = require("fs");
    // const path = require("path");

    // const saveDir = path.join(__dirname, "xl");
    // const filename = `${module}_${Date.now()}.xlsx`;
    // const filePath = path.join(saveDir, filename);

    // if (!fs.existsSync(saveDir)) {
    //   fs.mkdirSync(saveDir);
    // }

    // rows.forEach((row) => worksheet.addRow(row));
    // await workbook.xlsx.writeFile(filePath);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
}

async function getDaashboardData(req, res) {
  let tenantId = req?.user?.tenantId;
  if (!tenantId) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Tenant ID is required"));
  }
  const { expiredFrom, expiredTo, upcommingFrom, upcommingTo, selected } =
    req.body;
  try {
    const [totalAsset] = await pool.query(
      `SELECT COUNT(*) AS total from assets_${tenantId} ${selected == "all" ? "" : selected == "it" ? "WHERE asset_type = 'it'" : "WHERE asset_type = 'admin'"}`,
    );
    const total_asset = totalAsset[0].total;
    const [taggedAsset] = await pool.query(
      `SELECT COUNT(t.id) AS total FROM taggings_${tenantId} t
            LEFT JOIN assets_${tenantId} a ON a.id = t.asset_id
            ${selected == "all" ? "" : selected == "it" ? "WHERE a.asset_type = 'it'" : "WHERE a.asset_type = 'admin'"}
      `,
    );
    const total_tagged = taggedAsset[0].total;
    // const [detaggedAsset] = await pool.query(
    //     `SELECT COUNT(DISTINCT h.asset_id) AS total FROM history_${tenantId} h
    //     LEFT JOIN assets_${tenantId} a ON a.id = h.asset_id
    //     ${selected == "all" ? "" : selected == "it" ? "WHERE a.asset_type = 'it'" : "WHERE a.asset_type = 'admin'"}
    //     `
    // );
    // const total_detagged = detaggedAsset[0].total;
    // const not_assigned = total_asset - (total_tagged + total_detagged);

    const [assetStatusCounts] = await pool.query(`
            SELECT 
                COUNT(CASE WHEN t.asset_id IS NULL AND h.asset_id IS NULL THEN 1 END) as unusedAssets,
                COUNT(DISTINCT CASE WHEN t.asset_id IS NULL AND h.asset_id IS NOT NULL THEN a.id END) as historyOnlyAssets
            FROM assets_${tenantId} a
            LEFT JOIN taggings_${tenantId} t ON a.id = t.asset_id
            LEFT JOIN history_${tenantId} h ON a.id = h.asset_id
            ${selected == "all" ? "" : selected == "it" ? "WHERE a.asset_type = 'it'" : "WHERE a.asset_type = 'admin'"}
        `);
    const total_detagged = assetStatusCounts[0].historyOnlyAssets;
    const not_assigned = assetStatusCounts[0].unusedAssets;

    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    const [upcommingExp] = await pool.query(
      `
                SELECT asset_id,model_no,type,serial,exp_date,asset_code FROM assets_${tenantId} 
                WHERE
                    exp_date IS NOT NULL
                    ${selected == "all" ? "" : selected == "it" ? "AND asset_type = 'it'" : "AND asset_type = 'admin'"}
                    AND exp_date BETWEEN ? AND ?
                ORDER BY exp_date ASC
            `,
      [upcommingFrom, upcommingTo],
    );

    const [upcommingSubmission] = await pool.query(
      `
                SELECT asset_id,model_no,type,serial,exp_date,asset_code FROM assets_${tenantId} 
                    WHERE
                        exp_date IS NOT NULL
                        ${selected == "all" ? "" : selected == "it" ? "AND asset_type = 'it'" : "AND asset_type = 'admin'"}
                        AND exp_date BETWEEN ? AND ?
                    ORDER BY exp_date ASC
            `,
      [expiredFrom, expiredTo],
    );

    let [monthData] = await pool.query(
      `SELECT
                (MONTH(exp_date) - 1) AS month_no,
                COUNT(id) AS total
            FROM assets_${tenantId}
            WHERE exp_date IS NOT NULL
            ${selected == "all" ? "" : selected == "it" ? "AND asset_type = 'it'" : "AND asset_type = 'admin'"}
            AND exp_date > ?
            AND exp_date < DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY month_no
            ORDER BY month_no`,
      [getISTString(d)],
    );
    const monthNos = new Set();
    for (let i = 0; i < monthData.length; i++) {
      monthNos.add(monthData[i].month_no);
    }

    for (let i = 0; i < 12; i++) {
      if (!monthNos.has(i)) {
        monthData.push({
          month_no: i,
          total: 0,
        });
      }
    }

    monthData.sort((a, b) => a.month_no - b.month_no);
    const day = new Date();
    day.setDate(1);
    day.setHours(0, 0, 0, 0);
    day.setSeconds(day.getSeconds() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [expThisMon] = await pool.query(
      `SELECT COUNT(*) AS total from assets_${tenantId} WHERE (exp_date BETWEEN ? AND ?) ${selected == "all" ? "" : selected == "it" ? "AND asset_type = 'it'" : "AND asset_type = 'admin'"}`,
      [getSqlDate(day), getSqlDate(today)],
    );
    const currentMonth = today.getMonth();
    if (expThisMon[0].total > 0) {
      for (let i = 0; i < monthData.length; i++) {
        if (monthData[i].month_no == currentMonth) {
          monthData[i].total -= expThisMon[0].total;
          break;
        }
      }
    }

    const p1 = monthData.slice(0, currentMonth);
    const p2 = monthData.slice(currentMonth, 12);
    monthData = [...p2, ...p1];
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    for (let i = 0; i < monthData.length; i++) {
      monthData[i].month_name = months[monthData[i].month_no];
      delete monthData[i].month_no;
    }
    const data = {
      total_asset,
      total_tagged,
      total_detagged,
      not_assigned,
      upcommingExp,
      upcommingSubmission,
      monthData: [...p2, ...p1],
    };
    res.status(200).json(new ApiResponse(200, data, "Dashboard data fetched"));
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function getLowStockSpares(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;
  try {
    let whereClause = `
  WHERE obs_authorised > 0
  AND IFNULL(obs_held,0) < (0.25 * obs_authorised)
`;
    let params = [];
    if (search) {
      const searchableFields = [
        "description",
        "equipment_system",
        "category",
        "indian_pattern",
        "denos",
        "obs_authorised",
        "obs_maintained",
        "obs_held",
        "storage_location",
      ];

      // Remove semicolons
      const searchWords = search
        .split(/[,;\s]+/)
        .map((w) => w.trim())
        .filter(Boolean);

      let wordConditions = [];

      for (const word of searchWords) {
        let fieldFragments = [];

        for (const field of searchableFields) {
          fieldFragments.push(`${field} LIKE ?`);
          params.push(`%${word}%`);
        }

        // Each word must match at least one column
        wordConditions.push(`(${fieldFragments.join(" OR ")})`);
      }

      // All words must match
      whereClause += ` AND (${wordConditions.join(" AND ")})`;
    }
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM spares ${whereClause}`,
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
          search ? "No matching spares found" : "No spare found",
        ),
      );
    }
    const [rows] = await pool.query(
      `SELECT * FROM spares ${whereClause}
            ORDER BY description ASC
            LIMIT ? OFFSET ?;
        `,
      [...params, limit, offset],
    );
    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalSpares,
        totalPages: Math.ceil(totalSpares / limit),
        currentPage: page,
      },
      "Low stock spares",
    ).send(res);
  } catch (error) {
    console.log(error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  }
}

module.exports = {
  createSpare,
  getSpares,
  updateSpare,
  deleteSpare,
  approveObsAuth,
  getOBSAuthApprovalPending,
  rejectObsAuth,
  getAllApprovalPendings,
  getCriticalSpares,
  updateSpecialDemand,
  generateQRCode,
  generateExcel,
  getLowStockSpares,
};
