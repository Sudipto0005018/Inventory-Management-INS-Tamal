const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function updateStock(req, res) {
  const { id: userId } = req.user;
  const { id, qty_received, return_date, box_no, approve = true } = req.body;
  console.log(req.body);

  try {
    /** 1. Fetch issue */
    const [[issue]] = await pool.query(
      `SELECT spare_id, tool_id, transaction_id FROM pending_issue WHERE id = ?`,
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

    /** 5. Update temp issue */
    await pool.query(
      `
      UPDATE pending_issue
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
    console.error("UPDATE STOCK UPDATE ERROR =>", error);
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
  updateStock,
  generateQRCode,
};
