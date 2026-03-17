const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

// async function getTyLoanList(req, res) {
//   const page = parseInt(req.query?.page) || 1;
//   const limit = parseInt(req.query?.limit) || 10;
//   const offset = (page - 1) * limit;
//   const search = req.query?.search ? req.query.search.trim() : "";

//   /* ---------- BASE WHERE ---------- */
//   let whereClause = `
//     WHERE ty.status IN ('pending','partial','overdue')
//   `;

//   /* ---------- SEARCH FILTER ---------- */
//   if (search) {
//     whereClause += `
//       AND (
//         s.description LIKE ?
//         OR t.description LIKE ?
//         OR s.indian_pattern LIKE ?
//         OR t.indian_pattern LIKE ?
//         OR s.category LIKE ?
//         OR t.category LIKE ?
//         OR ty.service_no LIKE ?
//         OR ty.concurred_by LIKE ?
//         OR ty.box_no LIKE ?
//         OR u1.name LIKE ?
//         OR u2.name LIKE ?
//       )
//     `;
//   }

//   const searchParams = search ? Array(11).fill(`%${search}%`) : [];

//   try {
//     /* ---------- TOTAL COUNT ---------- */
//     const [countResult] = await pool.query(
//       `
//       SELECT COUNT(*) AS count
//       FROM ty_loan ty
//       LEFT JOIN spares s ON s.id = ty.spare_id
//       LEFT JOIN tools t ON t.id = ty.tool_id
//       LEFT JOIN users u1 ON u1.id = ty.created_by
//       LEFT JOIN users u2 ON u2.id = ty.approved_by
//       ${whereClause}
//       `,
//       searchParams,
//     );

//     const total = countResult[0].count;

//     if (total === 0) {
//       return res.status(200).json(
//         new ApiResponse(
//           200,
//           {
//             items: [],
//             totalItems: 0,
//             totalPages: 1,
//             currentPage: page,
//           },
//           "No ty loans found",
//         ),
//       );
//     }

//     /* ---------- LIST QUERY ---------- */
//     const query = `
//       SELECT
//         ty.id,
//         ty.spare_id,
//         ty.tool_id,

//         ty.qty_withdrawn,
//         ty.qty_received,

//         (ty.qty_withdrawn - IFNULL(ty.qty_received,0)) AS balance_qty,

//         ty.service_no,
//         ty.concurred_by,
//         ty.issue_date,
//         ty.loan_duration,
//         ty.return_date,

//         ty.created_by,
//         u1.name AS created_by_name,
//         ty.created_at,

//         ty.approved_by,
//         u2.name AS approved_by_name,
//         ty.approved_at,
//         ty.box_no,

//         CASE
//           WHEN ty.spare_id IS NOT NULL THEN 'spare'
//           WHEN ty.tool_id IS NOT NULL THEN 'tool'
//           ELSE 'unknown'
//         END AS source,

//         CASE
//           WHEN ty.spare_id IS NOT NULL THEN s.description
//           WHEN ty.tool_id IS NOT NULL THEN t.description
//         END AS description,

//         CASE
//           WHEN ty.spare_id IS NOT NULL THEN s.indian_pattern
//           WHEN ty.tool_id IS NOT NULL THEN t.indian_pattern
//         END AS indian_pattern,

//         CASE
//           WHEN ty.spare_id IS NOT NULL THEN s.category
//           WHEN ty.tool_id IS NOT NULL THEN t.category
//         END AS category,

//         CASE
//           WHEN ty.status IN ('pending','partial')
//           AND DATE_ADD(ty.issue_date, INTERVAL ty.loan_duration DAY) < CURDATE()
//           THEN 'overdue'
//           ELSE ty.status
//         END AS loan_status,

//         CASE
//           WHEN ty.spare_id IS NOT NULL THEN s.days_untill_return
//           WHEN ty.tool_id IS NOT NULL THEN t.days_untill_return
//         END AS days_untill_return

//       FROM ty_loan ty
//       LEFT JOIN spares s ON s.id = ty.spare_id
//       LEFT JOIN tools t ON t.id = ty.tool_id
//       LEFT JOIN users u1 ON u1.id = ty.created_by
//       LEFT JOIN users u2 ON u2.id = ty.approved_by

//       ${whereClause}
//       ORDER BY ty.created_at DESC
//       LIMIT ? OFFSET ?
//     `;

//     const [rows] = await pool.query(query, [...searchParams, limit, offset]);

//     return res.json(
//       new ApiResponse(
//         200,
//         {
//           items: rows,
//           totalItems: total,
//           totalPages: Math.ceil(total / limit),
//           currentPage: page,
//         },
//         "Ty Loan list retrieved successfully",
//       ),
//     );
//   } catch (err) {
//     console.error("GET Ty Loan ERROR =>", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch Ty Loan list",
//     });
//   }
// }

async function getTyLoanList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";

  /* BASE WHERE  */
  let whereClause = `
    WHERE ty.status IN ('pending','partial','overdue')
  `;

  /*  DYNAMIC SEARCH FILTER */
  const cols = req.query?.cols ? req.query.cols.split(",") : [];

  let searchParams = [];

  /* ---------- ADVANCED SEARCH FILTER ---------- */
  if (search) {
    const columnMap = {
      description: ["s.description", "t.description"],
      indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
      category: ["s.category", "t.category"],

      qty_withdrawn: ["ty.qty_withdrawn"],
      qty_received: ["ty.qty_received"],

      service_no: ["ty.service_no"],
      concurred_by: ["ty.concurred_by"],
      box_no: ["ty.box_no"],

      loan_duration: ["ty.loan_duration"],
      created_at: ["ty.created_at"],

      created_by_name: ["u1.name"],
      approved_by_name: ["u2.name"],
      issue_date: ["ty.issue_date"],
      loan_status: [
        `
      (
        CASE
          WHEN ty.status IN ('pending','partial')
          AND DATE_ADD(ty.issue_date, INTERVAL ty.loan_duration DAY) < CURDATE()
          THEN 'overdue'
          ELSE ty.status
        END
      )
      `,
      ],
    };

    const validCols = cols.map((c) => c.trim()).filter((col) => columnMap[col]);

    // Split by comma OR space
    const searchWords = search
      .split(/[,;\s]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    let searchConditions = [];

    for (const word of searchWords) {
      let wordFragments = [];

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col];

          for (const dbCol of dbCols) {
            // Numeric fields
            if (
              ["qty_withdrawn", "qty_received", "loan_duration"].includes(
                col,
              ) &&
              !isNaN(word)
            ) {
              searchParams.push(Number(word));
              wordFragments.push(`${dbCol} = ?`);
            }

            // Date field
            else if (col === "created_at") {
              searchParams.push(word);
              wordFragments.push(`DATE(${dbCol}) = ?`);
            }

            // Loan status (computed field)
            else if (col === "loan_status") {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }

            // Default LIKE
            else {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }
          }
        }
      } else {
        // Global fallback search
        searchParams.push(
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
        );

        wordFragments.push(`
        (
          s.description LIKE ?
          OR t.description LIKE ?
          OR ty.service_no LIKE ?
          OR ty.concurred_by LIKE ?
          OR u1.name LIKE ?
          OR u2.name LIKE ?
        )
      `);
      }

      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }

    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }

  try {
    /* TOTAL COUNT */
    const [countResult] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM ty_loan ty
      LEFT JOIN spares s ON s.id = ty.spare_id
      LEFT JOIN tools t ON t.id = ty.tool_id
      LEFT JOIN users u1 ON u1.id = ty.created_by
      LEFT JOIN users u2 ON u2.id = ty.approved_by
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
          "No ty loans found",
        ),
      );
    }

    /* LIST QUERY */
    const query = `
      SELECT
        ty.id,
        ty.spare_id,
        ty.tool_id,

        ty.qty_withdrawn,
        ty.qty_received,

        (ty.qty_withdrawn - IFNULL(ty.qty_received,0)) AS balance_qty,

        ty.service_no,
        ty.concurred_by,
        ty.issue_date,
        ty.loan_duration,
        ty.return_date,

        ty.created_by,
        u1.name AS created_by_name,
        ty.created_at,

        ty.approved_by,
        u2.name AS approved_by_name,
        ty.approved_at,
        ty.box_no,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN 'spare'
          WHEN ty.tool_id IS NOT NULL THEN 'tool'
          ELSE 'unknown'
        END AS source,

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
        "Ty Loan list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET Ty Loan ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Ty Loan list",
    });
  }
}

async function createTyLoan(req, res) {
  const { id: userId } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      qty_withdrawn,
      service_no,
      concurred_by,
      issue_date,
      loan_duration,
      return_date,
      qty_received,
      box_no,
      a,
      unit_name,
      individual_name,
      phone,
      designation,
    } = req.body;

    const transactionId = "TY-" + Date.now();
    const now = new Date();
    console.log(transactionId);

    /** 1. Fetch inventory */
    const [[row]] = await pool.query(
      `SELECT box_no, obs_held FROM ${spare_id ? "spares" : "tools"} WHERE id = ?`,
      [spare_id || tool_id],
    );

    const previousOBS = parseInt(row.obs_held);
    const spares = JSON.parse(row.box_no || "[]");

    let totalWithdrawQty = 0;
    const boxTransactions = [];

    /** 2. Box-wise update */
    const updatedBoxes = spares.map((spare) => {
      const match = box_no.find((item) => item.no == spare.no);
      if (!match) return spare;

      const prevQty = parseInt(spare.qtyHeld);
      const withdrawQty = parseInt(match.withdraw || 0);

      totalWithdrawQty += withdrawQty;

      boxTransactions.push([
        transactionId,
        null,
        spare_id ?? null,
        tool_id ?? null,
        spare.no,
        prevQty,
        -withdrawQty,
        now,
      ]);

      return {
        ...spare,
        qtyHeld: (prevQty - withdrawQty).toString(),
      };
    });

    const newOBS = previousOBS - totalWithdrawQty;

    /** 3. Update inventory */
    await pool.query(
      `UPDATE ${spare_id ? "spares" : "tools"}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, spare_id || tool_id],
    );

    /** 4. Insert ty loan */
  await pool.query(
    `
  INSERT INTO ty_loan (
    transaction_id,
    spare_id,
    tool_id,
    qty_withdrawn,
    service_no,
    unit_name,
    individual_name,
    phone,
    designation,
    concurred_by,
    issue_date,
    loan_duration,
    return_date,
    qty_received,
    created_by,
    created_at,
    approved_by,
    approved_at,
    box_no,
    status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL, ?, 'pending')
  `,
    [
      transactionId,
      a === "spare" ? spare_id : null,
      a === "tool" ? tool_id : null,
      qty_withdrawn,

      service_no,

      unit_name || null,
      individual_name || null,
      phone || null,
      designation || null,

      concurred_by || null,

      issue_date || null,
      loan_duration || null,
      return_date || null,
      qty_received || null,

      userId,

      JSON.stringify(updatedBoxes),
    ],
  );

    /** 5. Insert box transactions */
    if (boxTransactions.length) {
      const [record] = await pool.query(
        `
        INSERT INTO box_transaction (
          transaction_id, demand_transaction, spare_id, tool_id,
          box_no, prev_qty, withdrawl_qty, transaction_date
        ) VALUES ?
        `,
        [boxTransactions],
      );
    }

    /** 6. Insert OBS audit */
    await pool.query(
      `
      INSERT INTO obs_audit (
        transaction_id, previous_obs, new_obs
      ) VALUES (?, ?, ?)
      `,
      [transactionId, previousOBS, newOBS],
    );

    res.json({
      success: true,
      transactionId,
      message: "TY Loan created successfully",
    });
  } catch (err) {
    console.error("CREATE TY Loan ERROR =>", err.sqlMessage);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateTyLoan(req, res) {
  const { id: userId } = req.user;
  const { id, qty_received, return_date, box_no, approve = true } = req.body;
  const returnTransactionId = "TY-RET-" + Date.now();
  console.log(returnTransactionId);

  try {
    /** 1. Fetch loan issue */
    const [[issue]] = await pool.query(
      `SELECT  transaction_id, spare_id, tool_id,
       qty_withdrawn, qty_received, issue_date, loan_duration
       FROM ty_loan
       WHERE id = ?`,
      [id],
    );

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }
    const originalTransactionId = issue.transaction_id;
    // const { transaction_id } = issue;
    const isSpare = !!issue.spare_id;
    const inventoryTable = isSpare ? "spares" : "tools";
    const inventoryId = issue.spare_id || issue.tool_id;

    /** 🔹 Calculate cumulative return */
    const prevReturned = parseInt(issue.qty_received || 0);
    const currentReturn = parseInt(qty_received || 0);
    const totalReturned = prevReturned + currentReturn;

    const withdrawnQty = parseInt(issue.qty_withdrawn);

    /** Prevent over-return */
    if (totalReturned > withdrawnQty) {
      return res.status(400).json({
        success: false,
        message: "Returned quantity cannot be greater than withdrawn quantity",
      });
    }

    /** 🔹 Expected return date */
    const issueDate = new Date(issue.issue_date);
    const expectedReturnDate = new Date(issueDate);
    expectedReturnDate.setDate(
      expectedReturnDate.getDate() + parseInt(issue.loan_duration || 0),
    );

    /** 🔹 Actual return date */
    const actualReturnDate = new Date(return_date);

    /** 🔹 Base status from quantity */
    let status = "pending";

    if (totalReturned === 0) {
      status = "pending";
    } else if (totalReturned < withdrawnQty) {
      status = "partial";
    } else {
      status = "complete";
    }

    /** 🔴 OVERDUE CHECK */
    if (actualReturnDate > expectedReturnDate && totalReturned < withdrawnQty) {
      status = "overdue";
    }

    // if (actualReturnDate > expectedReturnDate) {
    //   status = "overdue";
    // }

    /** 2. Fetch inventory */
    const [[inventory]] = await pool.query(
      `SELECT box_no, obs_held FROM ${inventoryTable} WHERE id = ?`,
      [inventoryId],
    );

    const previousOBS = parseInt(inventory.obs_held);
    let boxes = JSON.parse(inventory.box_no || "[]");

    let totalDepositedQty = 0;
    const boxTransactions = [];
    const now = new Date();

    /** 3. Deposit box-wise */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no.find((b) => b.no === box.no);
      if (!match) return box;

      const prevQty = parseInt(box.qtyHeld);
      const depositQty = parseInt(match.deposit || 0);

      totalDepositedQty += depositQty;

      // boxTransactions.push([
      //   returnTransactionId, // ✅ NEW return transaction id
      //   originalTransactionId, // optional: link to original issue
      //   null,
      //   isSpare ? issue.spare_id : null,
      //   !isSpare ? issue.tool_id : null,
      //   box.no,
      //   prevQty,
      //   depositQty,
      //   now,
      // ]);

      boxTransactions.push([
        returnTransactionId, // transaction_id
        originalTransactionId, // demand_transaction
        isSpare ? issue.spare_id : null, // spare_id
        !isSpare ? issue.tool_id : null, // tool_id
        box.no, // box_no
        prevQty, // prev_qty
        depositQty, // withdrawl_qty (positive = return)
        now, // transaction_date
      ]);

      return {
        ...box,
        qtyHeld: (prevQty + depositQty).toString(),
      };
    });

    const newOBS = previousOBS + totalDepositedQty;

    /** 4. Update inventory */
    await pool.query(
      `UPDATE ${inventoryTable}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, inventoryId],
    );

    /** 5. Update TY loan (CUMULATIVE RETURN) */
    await pool.query(
      `
      UPDATE ty_loan
      SET qty_received = ?,
          return_date = ?,
          approved_by = ?,
          approved_at = NOW(),
          box_no = ?,
          status = ?
      WHERE id = ?
      `,
      [
        totalReturned, // cumulative qty
        return_date,
        approve ? userId : null,
        JSON.stringify(updatedBoxes),
        status,
        id,
      ],
    );

    /** 6. Insert box transactions */
    if (boxTransactions.length) {
      await pool.query(
        `
        INSERT INTO box_transaction (
          transaction_id, demand_transaction, spare_id, tool_id,
          box_no, prev_qty, withdrawl_qty, transaction_date
        ) VALUES ?
        `,
        [boxTransactions],
      );
    }

    /** 7. OBS audit */
    await pool.query(
      `
      INSERT INTO obs_audit (
        transaction_id, previous_obs, new_obs
      ) VALUES (?, ?, ?)
      `,
      [returnTransactionId, previousOBS, newOBS],
    );

    res.json({
      success: true,
      transactionId: returnTransactionId,
      status,
      message:
        status === "complete"
          ? "Full return completed"
          : "Partial return saved",
    });
  } catch (error) {
    console.error("UPDATE TY LOAN ERROR =>", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function generateQRCode(req, res) {
  const { tool_id, spare_id, boxes } = req.body;
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

    let data;

    if (tool_id) {
      const [rows] = await pool.query(
        "SELECT description, indian_pattern, equipment_system, box_no FROM tools WHERE id = ?",
        [tool_id],
      );

      if (!rows.length) {
        return res
          .status(404)
          .json(
            new ApiErrorResponse(404, {}, "Tool not found for QR generation"),
          );
      }

      data = rows[0];
    } else if (spare_id) {
      const [rows] = await pool.query(
        "SELECT description, indian_pattern, equipment_system, box_no FROM spares WHERE id = ?",
        [spare_id],
      );

      if (!rows.length) {
        return res
          .status(404)
          .json(
            new ApiErrorResponse(404, {}, "Spare not found for QR generation"),
          );
      }

      data = rows[0];
    } else {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Invalid QR generation request"));
    }

    for (let i = 0; i < boxes.length; i++) {
      let location = "";

      if (data.box_no) {
        const boxes = JSON.parse(data.box_no);

        const selectedBox = boxes.find((b) => b.no === box_no);

        if (selectedBox) {
          location = selectedBox.location || "";
        }
      }
      const box_no = boxes[i].box_no;
      const qrText = `${data.description}|${data.indian_pattern}|${data.uid}|${data.equipment_system}|${box_no}|${location}`;
      const qrURL = await qr.toDataURL(qrText, { margin: 0, width: 120 });
      const copy_count = Number(boxes[i].copy_count);
      for (let j = 0; j < Number(copy_count); j++) {
        if (i + j > 0) doc.addPage();
        doc.image(qrURL, 5, 5, { width: 50, height: 50 });
        doc.fontSize(8).text(data.description, 60, 5, { width: 100 });
        doc.fontSize(8).text(data.indian_pattern, 60, 15, { width: 100 });
        doc.fontSize(8).text(data.equipment_system, 60, 25, { width: 100 });
        doc.fontSize(8).text(box_no, 60, 35, { width: 100 });
        doc.fontSize(8).text(location, 60, 45, { width: 100 });
      }
    }
    doc.end();
  } catch (error) {
    console.log("Error while generating QR code:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getLogsTy(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";

  /* ---------- BASE WHERE ---------- */
  let whereClause = `
    WHERE ty.status = 'complete'
  `;

  /* ---------- SEARCH FILTER ---------- */
  const cols = req.query?.cols ? req.query.cols.split(",") : [];

  let searchParams = [];

  /* ---------- ADVANCED SEARCH FILTER ---------- */
  if (search) {
    const columnMap = {
      description: ["s.description", "t.description"],
      indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
      category: ["s.category", "t.category"],
      denos: ["s.denos", "t.denos"],

      qty_withdrawn: ["ty.qty_withdrawn"],
      qty_received: ["ty.qty_received"],

      service_no: ["ty.service_no"],
      concurred_by: ["ty.concurred_by"],
      box_no: ["ty.box_no"],

      unit: ["ty.unit_name"],
      name: ["ty.individual_name"],
      phone: ["ty.phone"],

      issue_date: ["ty.issue_date"],
      loan_duration: ["ty.loan_duration"],
      approved_at: ["ty.approved_at"],

      created_by_name: ["u1.name"],
      approved_by_name: ["u2.name"],
      issue_date: ["ty.issue_date"],
      loan_status: [
        `
      (
        CASE
          WHEN ty.status IN ('pending','partial')
          AND DATE_ADD(ty.issue_date, INTERVAL ty.loan_duration DAY) < CURDATE()
          THEN 'overdue'
          ELSE ty.status
        END
      )
      `,
      ],
    };

    const validCols = cols.map((c) => c.trim()).filter((col) => columnMap[col]);

    // Split by comma OR space
    const searchWords = search
      .split(/[,;\s]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    let searchConditions = [];

    for (const word of searchWords) {
      let wordFragments = [];

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col];

          for (const dbCol of dbCols) {
            // Numeric fields
            if (
              ["qty_withdrawn", "qty_received", "loan_duration"].includes(
                col,
              ) &&
              !isNaN(word)
            ) {
              searchParams.push(Number(word));
              wordFragments.push(`${dbCol} = ?`);
            }

            // Date field
            else if (col === "created_at") {
              searchParams.push(word);
              wordFragments.push(`DATE(${dbCol}) = ?`);
            }

            // Loan status (computed field)
            else if (col === "loan_status") {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }

            // Default LIKE
            else {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }
          }
        }
      } else {
        // Global fallback search
        searchParams.push(
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
        );

        wordFragments.push(`
        (
          s.description LIKE ?
          OR t.description LIKE ?
          OR ty.service_no LIKE ?
          OR ty.concurred_by LIKE ?
          OR u1.name LIKE ?
          OR u2.name LIKE ?
        )
      `);
      }

      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }

    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }

  try {
    /* ---------- TOTAL COUNT ---------- */
    const [countResult] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM ty_loan ty
      LEFT JOIN spares s ON s.id = ty.spare_id
      LEFT JOIN tools t ON t.id = ty.tool_id
      LEFT JOIN users u1 ON u1.id = ty.created_by
      LEFT JOIN users u2 ON u2.id = ty.approved_by
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
          "No ty loans found",
        ),
      );
    }

    /* ---------- LIST QUERY ---------- */
    const query = `
      SELECT
        ty.id,
        ty.spare_id,
        ty.tool_id,

        ty.qty_withdrawn,
        ty.qty_received,

        ty.unit_name,
        ty.individual_name AS name,
        ty.phone,
        ty.designation,
        
        (ty.qty_withdrawn - IFNULL(ty.qty_received,0)) AS balance_qty,

        ty.service_no,
        ty.concurred_by,
        ty.issue_date,
        ty.loan_duration,
        ty.return_date,

        ty.created_by,
        u1.name AS created_by_name,
        ty.created_at,

        ty.approved_by,
        u2.name AS approved_by_name,
        ty.approved_at,
        ty.box_no,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN 'spare'
          WHEN ty.tool_id IS NOT NULL THEN 'tool'
          ELSE 'unknown'
        END AS source,

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
          WHEN ty.spare_id IS NOT NULL THEN s.denos
          WHEN ty.tool_id IS NOT NULL THEN t.denos
        END AS denos,

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
        "Ty Loan logs retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET TY LOAN LOGS ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Ty Loan logs",
    });
  }
}

async function getTyLoanOverdue(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";

  /* ---------- BASE WHERE ---------- */
  let whereClause = `
  WHERE ty.status IN ('pending','partial')
  AND DATE_ADD(ty.issue_date, INTERVAL ty.loan_duration DAY) < CURDATE()
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
      "s.description",
      "t.description",
      "s.indian_pattern",
      "t.indian_pattern",
      "s.category",
      "t.category",
      "ty.service_no",
      "ty.concurred_by",
      "ty.box_no",
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
      FROM ty_loan ty
      LEFT JOIN spares s ON s.id = ty.spare_id
      LEFT JOIN tools t ON t.id = ty.tool_id
      LEFT JOIN users u1 ON u1.id = ty.created_by
      LEFT JOIN users u2 ON u2.id = ty.approved_by
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
          "No ty loans found",
        ),
      );
    }

    /* ---------- LIST QUERY ---------- */
    const query = `
      SELECT
        ty.id,
        ty.spare_id,
        ty.tool_id,

        ty.qty_withdrawn,
        ty.qty_received,

        (ty.qty_withdrawn - IFNULL(ty.qty_received,0)) AS balance_qty,

        ty.service_no,
        ty.concurred_by,
        ty.issue_date,
        ty.loan_duration,
        ty.return_date,

        ty.created_by,
        u1.name AS created_by_name,
        ty.created_at,

        ty.approved_by,
        u2.name AS approved_by_name,
        ty.approved_at,
        ty.box_no,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN 'spare'
          WHEN ty.tool_id IS NOT NULL THEN 'tool'
          ELSE 'unknown'
        END AS source,

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
        "Ty Loan list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET Ty Loan ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Ty Loan list",
    });
  }
}

async function reverseTyLoanIssue(req, res) {
  const { id: userId } = req.user;
  const { loanId } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /** 1️⃣ Fetch loan (LOCKED) */
    const [[loan]] = await connection.query(
      `SELECT * FROM ty_loan WHERE id = ? FOR UPDATE`,
      [loanId],
    );

    if (!loan) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (loan.status === "reversed") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Already reversed",
      });
    }

    const isSpare = !!loan.spare_id;
    const inventoryTable = isSpare ? "spares" : "tools";
    const inventoryId = loan.spare_id || loan.tool_id;

    /** 2️⃣ Fetch inventory (LOCKED) */
    const [[inventory]] = await connection.query(
      `SELECT box_no, obs_held FROM ${inventoryTable} WHERE id = ? FOR UPDATE`,
      [inventoryId],
    );

    if (!inventory) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    let boxes =
      typeof inventory.box_no === "string"
        ? JSON.parse(inventory.box_no || "[]")
        : inventory.box_no || [];

    /** 3️⃣ Get original box withdrawals */
    const [boxLogs] = await connection.query(
      `SELECT box_no, withdrawl_qty
       FROM box_transaction
       WHERE transaction_id = ?`,
      [loan.transaction_id],
    );

    if (!boxLogs.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No box transaction records found",
      });
    }

    /** 4️⃣ Restore quantity to respective boxes */
    const updatedBoxes = boxes.map((box) => {
      const match = boxLogs.find((log) => log.box_no == box.no);

      if (!match) return box;

      const currentQty = parseInt(box.qtyHeld || 0);
      const withdrawnQty = Math.abs(parseInt(match.withdrawl_qty));

      return {
        ...box,
        qtyHeld: (currentQty + withdrawnQty).toString(),
      };
    });

    /** 5️⃣ Calculate total restored */
    const totalRestoreQty = boxLogs.reduce(
      (sum, log) => sum + Math.abs(parseInt(log.withdrawl_qty)),
      0,
    );

    const previousOBS = parseInt(inventory.obs_held || 0);
    const newOBS = previousOBS + totalRestoreQty;

    /** 6️⃣ Update inventory */
    await connection.query(
      `UPDATE ${inventoryTable}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, inventoryId],
    );

    /** 7️⃣ Insert reverse ledger entry (recommended) */
    const reverseTransactionId = "TY-REV-" + Date.now();
    const now = new Date();

    const reverseEntries = boxLogs.map((log) => [
      reverseTransactionId,
      loan.transaction_id,
      isSpare ? loan.spare_id : null,
      !isSpare ? loan.tool_id : null,
      log.box_no,
      0,
      Math.abs(parseInt(log.withdrawl_qty)), // positive restore
      now,
    ]);

    await connection.query(
      `INSERT INTO box_transaction
       (transaction_id, demand_transaction, spare_id, tool_id,
        box_no, prev_qty, withdrawl_qty, transaction_date)
       VALUES ?`,
      [reverseEntries],
    );

    /** 8️⃣ Mark loan reversed */
    await connection.query(
      `UPDATE ty_loan
       SET status = 'reversed',
           approved_by = ?,
           approved_at = NOW()
       WHERE id = ?`,
      [userId, loanId],
    );

    await connection.commit();

    res.json({
      success: true,
      message: "TY Loan successfully reversed",
    });
  } catch (err) {
    await connection.rollback();
    console.error("REVERSE TY LOAN ERROR =>", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getTyLoanList,
  createTyLoan,
  updateTyLoan,
  generateQRCode,
  getLogsTy,
  getTyLoanOverdue,
  reverseTyLoanIssue,
};
