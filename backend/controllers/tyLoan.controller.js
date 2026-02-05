const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function getTyLoanList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    /* ---------- TOTAL COUNT ---------- */
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM ty_loan WHERE status = 'pending'`,
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
        ty.service_no,
        ty.concurred_by,
        ty.issue_date,
        ty.loan_duration,
        ty.return_date,
        ty.qty_received,

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
          ELSE NULL
        END AS description,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN s.indian_pattern
          WHEN ty.tool_id IS NOT NULL THEN t.indian_pattern
          ELSE NULL
        END AS indian_pattern,

        CASE
          WHEN ty.spare_id IS NOT NULL THEN s.category
          WHEN ty.tool_id IS NOT NULL THEN t.category
          ELSE NULL
        END AS category

      FROM ty_loan ty
      LEFT JOIN spares s ON s.id = ty.spare_id
      LEFT JOIN tools t ON t.id = ty.tool_id
      LEFT JOIN users u1 ON u1.id = ty.created_by
      LEFT JOIN users u2 ON u2.id = ty.approved_by
      WHERE ty.status = 'pending'
      ORDER BY ty.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [limit, offset]);

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
    } = req.body;

    const transactionId = "TY-" + Date.now();
    const now = new Date();

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
        a === "spare" ? spare_id : null,
        a === "tool" ? tool_id : null,
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
        transaction_id, spare_id, tool_id, qty_withdrawn,
        service_no, concurred_by, issue_date, loan_duration,
        return_date, qty_received, created_by, created_at,
        approved_by, approved_at, box_no, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL, ?, 'pending')
      `,
      [
        transactionId,
        a === "spare" ? spare_id : null,
        a === "tool" ? tool_id : null,
        qty_withdrawn,
        service_no,
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
    console.error("CREATE TY Loan ERROR =>", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateTyLoan(req, res) {
  const { id: userId } = req.user;
  const { id, qty_received, return_date, box_no, approve = true } = req.body;
  console.log(req.body);

  try {
    /** 1. Fetch issue */
    const [[issue]] = await pool.query(
      `SELECT spare_id, tool_id, transaction_id FROM ty_loan WHERE id = ?`,
      [id],
    );

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const { transaction_id } = issue;
    const isSpare = !!issue.spare_id;
    const inventoryTable = isSpare ? "spares" : "tools";
    const inventoryId = issue.spare_id || issue.tool_id;

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

    /** 3. Deposit logic */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no.find((b) => b.no === box.no);
      if (!match) return box;

      const prevQty = parseInt(box.qtyHeld);
      const depositQty = parseInt(match.deposit || 0);

      totalDepositedQty += depositQty;

      boxTransactions.push([
        transaction_id,
        null,
        isSpare ? issue.spare_id : null,
        !isSpare ? issue.tool_id : null,
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

    /** 4. Update inventory */
    await pool.query(
      `UPDATE ${inventoryTable}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, inventoryId],
    );

    /** 5. Update ty loan */
    await pool.query(
      `
      UPDATE ty_loan
      SET qty_received = ?, return_date = ?, approved_by = ?,
          box_no = ?, status = 'complete', approved_at = NOW()
      WHERE id = ?
      `,
      [
        qty_received,
        return_date,
        approve ? userId : null,
        JSON.stringify(updatedBoxes),
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

    /** 7. Insert OBS audit */
    await pool.query(
      `
      INSERT INTO obs_audit (
        transaction_id, previous_obs, new_obs
      ) VALUES (?, ?, ?)
      `,
      [transaction_id, previousOBS, newOBS],
    );

    res.json({
      success: true,
      transactionId: transaction_id,
      message: "Item returned and inventory updated successfully",
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
        "SELECT description, indian_pattern, uid, equipment_system FROM tools WHERE id = ?",
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
        "SELECT description, indian_pattern, uid, equipment_system FROM spares WHERE id = ?",
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
      const box_no = boxes[i].box_no;
      const qrText = `${data.description}|${data.indian_pattern}|${data.uid}|${data.equipment_system}|${box_no}`;
      const qrURL = await qr.toDataURL(qrText, { margin: 0, width: 120 });
      const copy_count = Number(boxes[i].copy_count);
      for (let j = 0; j < Number(copy_count); j++) {
        if (i + j > 0) doc.addPage();
        doc.image(qrURL, 5, 5, { width: 50, height: 50 });
        doc.fontSize(8).text(data.description, 60, 5, { width: 100 });
        doc.fontSize(8).text(data.indian_pattern, 60, 15, { width: 100 });
        doc.fontSize(8).text(data.uid, 60, 25, { width: 100 });
        doc.fontSize(8).text(data.equipment_system, 60, 35, { width: 100 });
        doc.fontSize(8).text(box_no, 60, 45, { width: 100 });
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

module.exports = {
  getTyLoanList,
  createTyLoan,
  updateTyLoan,
  generateQRCode,
};
