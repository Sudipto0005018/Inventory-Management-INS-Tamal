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
    obs_maintained,
    category,
    box_no,
    item_distribution,
    storage_location,
    item_code,
    indian_pattern,
    remarks,
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

    // ✅ MULTI IMAGE FILENAMES
    const images = req.files?.map((file) => file.filename) || [];

    const query = `
      INSERT INTO doc_corner
      (
        description,
        folder_no,
        equipment_system,
        denos,
        obs_authorised,
        obs_maintained,
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
        images,
        uidoem,
        supplier,
        substitute_name,
        local_terminology
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      description,
      folder_no || null,
      equipment_system,
      denos || null,
      obs_authorised || null,
      obs_maintained || null,
      obs_authorised_new || null,
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
      const searchableFields = [
        "description",
        "equipment_system",
        "folder_no",
        "item_code",
        "obs_authorised",
        "obs_held",
        "obs_maintained",
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
          // If later you add numeric fields, handle like this:
          if (!isNaN(word) && ["days_untill_return"].includes(field)) {
            params.push(Number(word));
            fieldFragments.push(`${field} = ?`);
          } else {
            params.push(`%${word}%`);
            fieldFragments.push(`${field} LIKE ?`);
          }
        }

        // Each word must match at least one column
        wordConditions.push(`(${fieldFragments.join(" OR ")})`);
      }

      // All words must match
      whereClause += ` AND (${wordConditions.join(" AND ")})`;
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
    obs_maintained,
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

  const imageStatus = req.body.imageStatus
    ? JSON.parse(req.body.imageStatus)
    : [];

  if (!description || !equipment_system) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  try {
    /* 1️⃣ Fetch current document */
    const [[doc]] = await pool.query(
      `SELECT obs_authorised, images FROM doc_corner WHERE id = ?`,
      [id],
    );

    if (!doc) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Document not found"));
    }

    /* 2️⃣ If obs_authorised changed → approval required (mirror spare behavior) */
    if (doc.obs_authorised != obs_authorised) {
      const [[pending]] = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM approval
        WHERE doc_corner_id = ?
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

      await pool.query(
        `
        INSERT INTO approval
          (doc_corner_id, created_by, field_name, old_value, new_value, status)
        VALUES
          (?, ?, 'obs_authorised', ?, ?, 'pending')
        `,
        [id, req.user.id, doc.obs_authorised, obs_authorised],
      );
    }

    /* ---------------- SAFE OLD IMAGE PARSE ---------------- */

    let oldImages = [];

    if (doc.images) {
      try {
        const parsed =
          typeof doc.images === "string" ? JSON.parse(doc.images) : doc.images;

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

    if (!Array.isArray(oldImages)) {
      oldImages = [];
    }

    let finalImages = [...oldImages];

    const uploadMap = {};

    if (req.files) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/images_(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          uploadMap[index] = file.filename;
        }
      });
    }

    // imageStatus.forEach((status, index) => {
    //   /* DELETE */
    //   if (status.isDeleted) {
    //     if (finalImages[index]) {
    //       unlinkFile(finalImages[index]);
    //     }
    //     finalImages[index] = null;
    //   }

    //   /* REPLACE */
    //   if (status.isReplaced) {
    //     if (finalImages[index]) {
    //       unlinkFile(finalImages[index]);
    //     }

    //     if (uploadMap[index]) {
    //       finalImages[index] = uploadMap[index];
    //     }
    //   }
    // });

    imageStatus.forEach((status, index) => {
      if (status.isDeleted) {
        finalImages[index] = null;
      }

      if (status.isReplaced) {
        if (uploadMap[index]) {
          finalImages[index] = uploadMap[index];
        }
      }
    });
    const removeFiles = oldImages.filter((f) => !finalImages.includes(f));

    for (let i = 0; i < removeFiles.length; i++) {
      unlinkFile(removeFiles[i]);
    }
    finalImages = finalImages.filter(
      (img) =>
        img !== null && img !== "" && img !== "null" && img !== "undefined",
    );

    while (finalImages.length && finalImages[finalImages.length - 1] === null) {
      finalImages.pop();
    }

    console.log("REQ.FILES:", req.files);
    console.log("IMAGE STATUS:", imageStatus);
    console.log("OLD IMAGES:", oldImages);
    console.log("UPLOAD MAP:", uploadMap);
    console.log("FINAL IMAGES:", finalImages);

    /* 3️⃣ Update doc_corner including images */
    const [result] = await pool.query(
      `
      UPDATE doc_corner
      SET
        description = ?,
        folder_no = ?,
        equipment_system = ?,
        denos = ?,
        obs_authorised = ?,
        obs_maintained = ?,
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
        local_terminology = ?,
        images = ?
      WHERE id = ?
      `,
      [
        description,
        folder_no || null,
        equipment_system,
        denos || null,
        obs_authorised || null,
        obs_maintained || null,
        obs_authorised_new || null,
        obs_held || null,
        b_d_authorised || null,
        category || null,
        box_no || null,
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
        JSON.stringify(finalImages),
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Document not found"));
    }

    // const removeFiles = oldImages.filter((f) => !finalImages.includes(f));
    // if (finalImages.length > 0) {
    //   for (let i = 0; i < removeFiles.length; i++) {
    //     unlinkFile(removeFiles[i]);
    //   }
    // }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          doc.obs_authorised != obs_authorised
            ? "Document updated. Approval request sent."
            : "Document updated successfully",
        ),
      );
  } catch (error) {
    console.error("Error while updating document:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getDocIssue(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const cols = req.query?.cols ? req.query.cols.split(",") : [];
  const search = req.query?.search ? req.query.search.trim() : "";

  /* BASE WHERE*/
  let whereClause = `
    WHERE (di.qty_received IS NULL 
           OR di.qty_received < di.qty_withdrawn)
  `;

  let searchClause = "";
  let searchParams = [];

  if (search) {
    const searchableColumns = {
      description: "dc.description",
      indian_pattern: "dc.indian_pattern",
      category: "dc.category",
      folder_no: "dc.folder_no",
      equipment_system: "dc.equipment_system",
      service_no: "di.service_no",
      concurred_by: "di.concurred_by",
      issue_to: "di.issue_to",
      created_at: "di.created_at",
    };

    const fieldsToSearch =
      cols.length > 0
        ? cols.filter((c) => searchableColumns[c])
        : Object.keys(searchableColumns);

    if (fieldsToSearch.length > 0) {
      // Split by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((w) => w.trim())
        .filter(Boolean);

      let wordConditions = [];

      for (const word of searchWords) {
        let fieldFragments = [];

        for (const field of fieldsToSearch) {
          fieldFragments.push(`${searchableColumns[field]} LIKE ?`);
          searchParams.push(`%${word}%`);
        }

        // Each word must match at least one selected column
        wordConditions.push(`(${fieldFragments.join(" OR ")})`);
      }

      // All words must match
      searchClause = ` AND (${wordConditions.join(" AND ")})`;
    }
  }

  try {
    /* TOTAL COUNT  */
    const [countResult] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM doc_issue di
      LEFT JOIN doc_corner dc ON dc.id = di.doc_id
      LEFT JOIN users u1 ON u1.id = di.created_by
      LEFT JOIN users u2 ON u2.id = di.approved_by
      ${whereClause}
      ${searchClause}
      `,
      searchParams,
    );

    const total = countResult[0].count;

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
          "No document issues found",
        ),
      );
    }

    /* ---------- LIST QUERY ---------- */
    const query = `
      SELECT
        di.id,
        di.doc_id,

        dc.description,
        dc.indian_pattern,
        dc.category,
        dc.folder_no,
        dc.box_no,
        dc.equipment_system,

        di.qty_withdrawn,
        di.qty_received,

        (di.qty_withdrawn - IFNULL(di.qty_received,0)) AS balance_qty,

        di.service_no,
        di.concurred_by,
        di.issue_to,
        di.issue_date,
        di.loan_duration,
        di.return_date,

      dc.days_untill_return,
      CASE
      WHEN DATE_ADD(di.issue_date, INTERVAL di.loan_duration DAY) < CURDATE()
      THEN 'overdue'
      ELSE 'pending'
    END AS loan_status,


        di.created_by,
        u1.name AS created_by_name,
        di.created_at,

        di.approved_by,
        u2.name AS approved_by_name,
        di.approved_at

      FROM doc_issue di
      LEFT JOIN doc_corner dc ON dc.id = di.doc_id
      LEFT JOIN users u1 ON u1.id = di.created_by
      LEFT JOIN users u2 ON u2.id = di.approved_by

    ${whereClause}
    ${searchClause}
      ORDER BY di.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...searchParams, limit, offset]);

    return res.json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "Document issue list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET DOC ISSUE ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document issue list",
    });
  }
}

async function createDocIssue(req, res) {
  const { id: userId } = req.user;

  try {
    let {
      doc_id,
      qty_withdrawn,
      service_no,
      concurred_by,
      issue_to,
      issue_date,
      loan_duration,
      return_date,
      qty_received,
      box_no,
    } = req.body;

    if (!doc_id) {
      return res.status(400).json({
        success: false,
        message: "doc_id is required",
      });
    }

    /** Safe box_no parsing */
    if (!box_no) box_no = [];

    if (typeof box_no === "string") {
      try {
        box_no = JSON.parse(box_no);
      } catch {
        box_no = [];
      }
    }

    if (!Array.isArray(box_no)) box_no = [];

    const transactionId = "DOC-" + Date.now();
    const now = new Date();

    /** Fetch inventory */
    const [[row]] = await pool.query(
      `SELECT box_no, obs_held FROM doc_corner WHERE id = ?`,
      [doc_id],
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    /** Safe DB box parsing */
    let boxes = [];

    try {
      boxes =
        typeof row.box_no === "string" ? JSON.parse(row.box_no) : row.box_no;

      if (typeof boxes === "string") {
        boxes = JSON.parse(boxes);
      }

      if (!Array.isArray(boxes)) boxes = [];
    } catch {
      boxes = [];
    }

    const previousOBS = parseInt(row.obs_held || 0);

    let totalWithdrawQty = 0;
    const boxTransactions = [];

    /** 2️⃣ Box update */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no.find((b) => b.no == box.no);
      if (!match) return box;

      const prevQty = parseInt(box.qtyHeld);
      const withdrawQty = parseInt(match.withdraw || 0);

      totalWithdrawQty += withdrawQty;

      boxTransactions.push([
        transactionId,
        null,
        doc_id,
        box.no,
        prevQty,
        -withdrawQty,
        now,
      ]);

      return {
        ...box,
        qtyHeld: (prevQty - withdrawQty).toString(),
      };
    });

    const newOBS = previousOBS - totalWithdrawQty;

    /** 3️⃣ Update inventory */
    await pool.query(
      `UPDATE doc_corner SET box_no = ?, obs_held = ? WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, doc_id],
    );

    /** 4️⃣ Insert issue */
    await pool.query(
      `
      INSERT INTO doc_issue (
        transaction_id,
        doc_id,
        qty_withdrawn,
        service_no,
        concurred_by,
        issue_to,
        issue_date,
        loan_duration,
        return_date,
        qty_received,
        created_by,
        created_at,
        box_no,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'pending')
      `,
      [
        transactionId,
        doc_id,
        qty_withdrawn,
        service_no,
        concurred_by,
        issue_to,
        issue_date,
        loan_duration,
        return_date,
        qty_received || 0,
        userId,
        JSON.stringify(box_no),
        userId,
      ],
    );

    /** 5️⃣ Box transactions */
    if (boxTransactions.length) {
      await pool.query(
        `
        INSERT INTO box_transaction (
          transaction_id,
          demand_transaction,
          doc_id,
          box_no,
          prev_qty,
          withdrawl_qty,
          transaction_date
        ) VALUES ?
        `,
        [boxTransactions],
      );
    }

    /** 6️⃣ OBS audit */
    await pool.query(
      `
      INSERT INTO obs_audit (
        transaction_id,
        previous_obs,
        new_obs
      ) VALUES (?, ?, ?)
      `,
      [transactionId, previousOBS, newOBS],
    );

    res.json({
      success: true,
      transactionId,
      message: "Document issued successfully",
    });
  } catch (err) {
    console.error("CREATE DOC ISSUE ERROR =>", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function updateDocIssue(req, res) {
  const { id: userId } = req.user;
  const { id, qty_received, return_date, box_no, approve = true } = req.body;

  try {
    /** Fetch issue */
    if (typeof box_no === "string") {
      try {
        box_no = JSON.parse(box_no);
      } catch {
        box_no = []; // Default to empty array on parsing error
      }
    }
    if (!Array.isArray(box_no)) {
      box_no = []; // Ensure box_no is always an array
    }
    const [[issue]] = await pool.query(
      `
      SELECT doc_id, qty_withdrawn, qty_received
      FROM doc_issue
      WHERE id = ?
      `,
      [id],
    );

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const prevReturned = parseInt(issue.qty_received || 0);
    const currentReturn = parseInt(qty_received || 0);
    const totalReturned = prevReturned + currentReturn;
    const withdrawnQty = parseInt(issue.qty_withdrawn);

    if (totalReturned > withdrawnQty) {
      return res.status(400).json({
        success: false,
        message: "Returned qty exceeds withdrawn qty",
      });
    }

    /** Status logic */
    let status = "pending";
    if (totalReturned === withdrawnQty) status = "complete";
    else if (totalReturned > 0) status = "partial";

    /** 2️⃣ Fetch inventory */
    const [[inventory]] = await pool.query(
      `
      SELECT box_no, obs_held
      FROM doc_corner
      WHERE id = ?
      `,
      [issue.doc_id],
    );

    const previousOBS = parseInt(inventory.obs_held || 0);
    console.log(inventory.box_no);

    let boxes = JSON.parse(
      typeof inventory.box_no == "string"
        ? inventory.box_no
        : JSON.stringify(inventory.box_no) || "[]",
    );

    let totalDepositedQty = 0;
    const boxTransactions = [];
    const now = new Date();

    /** 3️⃣ Deposit box-wise */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no.find((b) => b.no === box.no);
      if (!match) return box;

      const prevQty = parseInt(box.qtyHeld);
      const depositQty = parseInt(match.deposit || 0);

      totalDepositedQty += depositQty;

      boxTransactions.push([
        "RET-" + Date.now(),
        null,
        issue.doc_id,
        box.no,
        prevQty,
        depositQty,
        now,
      ]);

      return {
        ...box,
        qtyHeld: (prevQty + depositQty).toString(),
      };
    });

    const newOBS = previousOBS + totalDepositedQty;

    /** 4️⃣ Update inventory */
    await pool.query(
      `
      UPDATE doc_corner
      SET box_no = ?, obs_held = ?
      WHERE id = ?
      `,
      [JSON.stringify(updatedBoxes), newOBS, issue.doc_id],
    );

    /** 5️⃣ Update issue */
    await pool.query(
      `
      UPDATE doc_issue
      SET qty_received = ?,
          return_date = ?,
          approved_by = ?,
          approved_at = NOW()
      WHERE id = ?
      `,
      [totalReturned, return_date, approve ? userId : null, id],
    );

    /** 6️⃣ Box transactions */
    if (boxTransactions.length) {
      await pool.query(
        `
        INSERT INTO box_transaction (
          transaction_id,
          demand_transaction,
          doc_id,
          box_no,
          prev_qty,
          withdrawl_qty,
          transaction_date
        ) VALUES ?
        `,
        [boxTransactions],
      );
    }

    /** 7️⃣ OBS audit */
    await pool.query(
      `
      INSERT INTO obs_audit (
        transaction_id,
        previous_obs,
        new_obs
      ) VALUES (?, ?, ?)
      `,
      ["RET-" + Date.now(), previousOBS, newOBS],
    );

    res.json({
      success: true,
      status,
      message:
        status === "complete"
          ? "Full return completed"
          : "Partial return saved",
    });
  } catch (error) {
    console.error("UPDATE DOC ISSUE ERROR =>", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function generateQRCode(req, res) {
  const { id, boxes } = req.body;

  console.log("req.body =>", req.body);

  const PDFDocument = require("pdfkit");
  const qr = require("qrcode");

  try {
    /** ---------------- VALIDATION ---------------- */
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "doc_issue id is required",
      });
    }

    if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Boxes data is required",
      });
    }

    /** ---------------- FETCH ISSUE ---------------- */
    const [[issue]] = await pool.query(
      `SELECT doc_id 
       FROM doc_issue 
       WHERE id = ?`,
      [id],
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue record not found",
      });
    }

    /** ---------------- FETCH DOCUMENT ---------------- */
    const [[docData]] = await pool.query(
      `SELECT 
          description,
          indian_pattern,
          equipment_system
       FROM doc_corner
       WHERE id = ?`,
      [issue.doc_id],
    );

    if (!docData) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    /** ---------------- PDF INIT ---------------- */
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
        `inline; filename="doc_qrcodes_${Date.now()}.pdf"`,
      );

      res.send(pdfData);
    });

    /** ---------------- QR GENERATION ---------------- */
    let isFirstPage = true;

    for (const box of boxes) {
      const box_no = box.box_no;
      const copy_count = parseInt(box.copy_count || 0);

      if (!box_no || copy_count <= 0) continue;

      /** QR TEXT (Removed UID) */
      const qrText = `${docData.description}|${docData.indian_pattern}|${docData.equipment_system}|${box_no}`;

      const qrURL = await qr.toDataURL(qrText, {
        margin: 0,
        width: 120,
      });

      for (let i = 0; i < copy_count; i++) {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        /** QR IMAGE */
        doc.image(qrURL, 5, 5, { width: 50, height: 50 });

        /** TEXT */
        doc.fontSize(8).text(docData.description, 60, 5, {
          width: 100,
        });

        doc
          .fontSize(8)
          .text(`IN: ${docData.indian_pattern}`, 60, 15, { width: 100 });

        doc
          .fontSize(8)
          .text(`EQPT: ${docData.equipment_system}`, 60, 25, { width: 100 });

        doc.fontSize(8).text(`BOX: ${box_no}`, 60, 35, { width: 100 });
      }
    }

    doc.end();
  } catch (error) {
    console.log("Error while generating QR code:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getDocLogs(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const cols = req.query?.cols ? req.query.cols.split(",") : [];
  const search = req.query?.search ? req.query.search.trim() : "";

  /* ---------- BASE WHERE (Completed) ---------- */
  let whereClause = `
    WHERE di.qty_received >= di.qty_withdrawn
  `;
  let searchClause = "";
  let searchParams = [];

  if (search) {
    const searchableColumns = {
      description: "dc.description",
      indian_pattern: "dc.indian_pattern",
      category: "dc.category",
      folder_no: "dc.folder_no",
      equipment_system: "dc.equipment_system",
      service_no: "di.service_no",
      concurred_by: "di.concurred_by",
      issue_to: "di.issue_to",
      created_at: "di.created_at",
    };

    const fieldsToSearch =
      cols.length > 0
        ? cols.filter((c) => searchableColumns[c])
        : Object.keys(searchableColumns);

    if (fieldsToSearch.length > 0) {
      // Split by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((w) => w.trim())
        .filter(Boolean);

      let wordConditions = [];

      for (const word of searchWords) {
        let fieldFragments = [];

        for (const field of fieldsToSearch) {
          fieldFragments.push(`${searchableColumns[field]} LIKE ?`);
          searchParams.push(`%${word}%`);
        }

        // Each word must match at least one selected column
        wordConditions.push(`(${fieldFragments.join(" OR ")})`);
      }

      // All words must match
      searchClause = ` AND (${wordConditions.join(" AND ")})`;
    }
  }
  try {
    /* ---------- TOTAL COUNT ---------- */
    const [countResult] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM doc_issue di
      LEFT JOIN doc_corner dc ON dc.id = di.doc_id
      LEFT JOIN users u1 ON u1.id = di.created_by
      LEFT JOIN users u2 ON u2.id = di.approved_by
      ${whereClause}
      ${searchClause}
      `,
      searchParams,
    );

    const total = countResult[0].count;

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
          "No document issue logs found",
        ),
      );
    }

    /* ---------- LIST QUERY ---------- */
    const query = `
      SELECT
        di.id,
        di.doc_id,

        dc.description,
        dc.indian_pattern,
        dc.category,
        dc.folder_no,
        dc.box_no,
        dc.equipment_system,

        di.qty_withdrawn,
        di.qty_received,

        (di.qty_withdrawn - IFNULL(di.qty_received,0)) AS balance_qty,

        di.service_no,
        di.concurred_by,
        di.issue_to,
        di.issue_date,
        di.loan_duration,
        di.return_date,

        di.created_by,
        u1.name AS created_by_name,
        di.created_at,

        di.approved_by,
        u2.name AS approved_by_name,
        di.approved_at,

        CASE
          WHEN di.qty_received >= di.qty_withdrawn
          THEN 'completed'
          ELSE 'pending'
        END AS loan_status

      FROM doc_issue di
      LEFT JOIN doc_corner dc ON dc.id = di.doc_id
      LEFT JOIN users u1 ON u1.id = di.created_by
      LEFT JOIN users u2 ON u2.id = di.approved_by

      ${whereClause}
      ${searchClause}
      ORDER BY di.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...searchParams, limit, offset]);

    return res.json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "Document issue logs retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET DOC LOGS ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document issue logs",
    });
  }
}

async function getLowStockDocuments(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;
  try {
    let whereClause = "WHERE obs_held <(SELECT COUNT(*) / 4 FROM doc_corner)";
    let params = [];
    if (search) {
      whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM doc_corner ${whereClause}`,
      params,
    );
    const totalDocuments = totalCount[0].count;

    if (totalDocuments === 0) {
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
    const [rows] = await pool.query(
      `SELECT * FROM doc_corner ${whereClause}
            ORDER BY description ASC
            LIMIT ? OFFSET ?;
        `,
      [...params, limit, offset],
    );
    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalDocuments,
        totalPages: Math.ceil(totalDocuments / limit),
        currentPage: page,
      },
      "Low stock documents",
    ).send(res);
  } catch (error) {
    console.log(error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  }
}

async function getDocOverdue(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";

  /* ---------- BASE WHERE ---------- */
  let whereClause = `
  WHERE (di.qty_received IS NULL 
         OR di.qty_received < di.qty_withdrawn)
  AND DATE_ADD(di.issue_date, INTERVAL di.loan_duration DAY) < CURDATE()
`;

  /* ---------- SEARCH FILTER ---------- */
  let searchParams = [];

  if (search) {
    // Split by comma OR space
    const searchWords = search
      .split(/[,;\s]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    const searchableColumns = [
      "dc.description",
      "dc.indian_pattern",
      "dc.category",
      "dc.folder_no",
      "dc.box_no",
      "dc.equipment_system",
      "di.service_no",
      "di.concurred_by",
      "di.issue_to",
      "u1.name",
      "u2.name",
    ];

    let wordConditions = [];

    for (const word of searchWords) {
      let fieldConditions = [];

      for (const column of searchableColumns) {
        fieldConditions.push(`${column} LIKE ?`);
        searchParams.push(`%${word}%`);
      }

      // Each word must match at least one column
      wordConditions.push(`(${fieldConditions.join(" OR ")})`);
    }

    // All words must match
    whereClause += ` AND (${wordConditions.join(" AND ")})`;
  }

  try {
    /* ---------- TOTAL COUNT ---------- */
    const [countResult] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM doc_issue di
      LEFT JOIN doc_corner dc ON dc.id = di.doc_id
      LEFT JOIN users u1 ON u1.id = di.created_by
      LEFT JOIN users u2 ON u2.id = di.approved_by
      ${whereClause}
      `,
      searchParams,
    );

    const total = countResult[0].count;

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
          "No document issues found",
        ),
      );
    }

    /* ---------- LIST QUERY ---------- */
    const query = `
      SELECT
        di.id,
        di.doc_id,

        dc.description,
        dc.indian_pattern,
        dc.category,
        dc.folder_no,
        dc.box_no,
        dc.equipment_system,

        di.qty_withdrawn,
        di.qty_received,

        (di.qty_withdrawn - IFNULL(di.qty_received,0)) AS balance_qty,

        di.service_no,
        di.concurred_by,
        di.issue_to,
        di.issue_date,
        di.loan_duration,
        di.return_date,

      dc.days_untill_return,
      CASE
      WHEN DATE_ADD(di.issue_date, INTERVAL di.loan_duration DAY) < CURDATE()
      THEN 'overdue'
      ELSE 'pending'
    END AS loan_status,


        di.created_by,
        u1.name AS created_by_name,
        di.created_at,

        di.approved_by,
        u2.name AS approved_by_name,
        di.approved_at

      FROM doc_issue di
      LEFT JOIN doc_corner dc ON dc.id = di.doc_id
      LEFT JOIN users u1 ON u1.id = di.created_by
      LEFT JOIN users u2 ON u2.id = di.approved_by

      ${whereClause}
      ORDER BY di.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...searchParams, limit, offset]);

    return res.json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "Document issue list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET DOC ISSUE ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document issue list",
    });
  }
}

module.exports = {
  createDocCorner,
  getDocCorner,
  updateDocCorner,
  getDocIssue,
  createDocIssue,
  updateDocIssue,
  generateQRCode,
  getDocLogs,
  getLowStockDocuments,
  getDocOverdue,
};
