const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function createTemporaryIssue(req, res) {
  const { id: userId } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      qty_withdrawn,
      service_no,
      issue_to,
      issue_date,
      loan_duration,
      return_date,
      qty_received,
      box_no,
      a, // "spare" or "tool"
    } = req.body;

    const query = `
      INSERT INTO temporary_issue_local (
        spare_id,
        tool_id,
        qty_withdrawn,
        service_no,
        issue_to,
        issue_date,
        loan_duration,
        return_date,
        qty_received,
        created_by,
        created_at,
        approved_by,
        approved_at,
        box_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL, ?)
    `;

    const [[row]] = await pool.query(
      `SELECT box_no FROM ${spare_id ? "spares" : "tools"} WHERE id = ?`,
      [spare_id || tool_id],
    );
    const spares = JSON.parse(row.box_no);

    const updated = spares.map((spare) => {
      const match = box_no.find((item) => item.no == spare.no);
      if (match) {
        return {
          ...spare,
          qtyHeld: (
            parseInt(spare.qtyHeld) - parseInt(match.withdraw)
          ).toString(),
        };
      }
    });

    await pool.query(
      `UPDATE ${spare_id ? "spares" : "tools"} SET box_no = ? WHERE id = ?`,
      [JSON.stringify(updated), spare_id || tool_id],
    );

    await pool.query(query, [
      a === "spare" ? spare_id : null,
      a === "tool" ? tool_id : null,
      qty_withdrawn,
      service_no,
      issue_to || null,
      issue_date || null,
      loan_duration || null,
      return_date || null,
      qty_received || null,
      userId,
      JSON.stringify(updated),
    ]);

    res.json({
      success: true,
      message: "Temporary Issue created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getTemporaryIssueList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    /* ---------- TOTAL COUNT ---------- */
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM temporary_issue_local`,
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
          "No temporary issues found",
        ),
      );
    }

    /* ---------- LIST QUERY ---------- */
    const query = `
      SELECT
        til.id,
        til.spare_id,
        til.tool_id,

        til.qty_withdrawn,
        til.service_no,
        til.issue_to,
        til.issue_date,
        til.loan_duration,
        til.return_date,
        til.qty_received,

        til.created_by,
        u1.name AS created_by_name,
        til.created_at,

        til.approved_by,
        u2.name AS approved_by_name,
        til.approved_at,
        til.box_no,

        CASE
          WHEN til.spare_id IS NOT NULL THEN 'spare'
          WHEN til.tool_id IS NOT NULL THEN 'tool'
          ELSE 'unknown'
        END AS source,

        CASE
          WHEN til.spare_id IS NOT NULL THEN s.description
          WHEN til.tool_id IS NOT NULL THEN t.description
          ELSE NULL
        END AS description,

        CASE
          WHEN til.spare_id IS NOT NULL THEN s.indian_pattern
          WHEN til.tool_id IS NOT NULL THEN t.indian_pattern
          ELSE NULL
        END AS indian_pattern,

        CASE
          WHEN til.spare_id IS NOT NULL THEN s.category
          WHEN til.tool_id IS NOT NULL THEN t.category
          ELSE NULL
        END AS category,

        CASE
          WHEN til.spare_id IS NOT NULL THEN s.equipment_system
          WHEN til.tool_id IS NOT NULL THEN t.equipment_system
          ELSE NULL
        END AS equipment_system

      FROM temporary_issue_local til
      LEFT JOIN spares s ON s.id = til.spare_id
      LEFT JOIN tools t ON t.id = til.tool_id
      LEFT JOIN users u1 ON u1.id = til.created_by
      LEFT JOIN users u2 ON u2.id = til.approved_by

      ORDER BY til.created_at DESC
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
        "Temporary issue list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET TEMPORARY ISSUE ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch temporary issue list",
    });
  }
}

async function updateTemporaryIssue(req, res) {
  const { id: userId } = req.user;

  const { id, qty_received, return_date, box_no, approve = true } = req.body;

  try {
    const [[issue]] = await pool.query(
      `SELECT spare_id, tool_id FROM temporary_issue_local WHERE id = ?`,
      [id],
    );

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const isSpare = !!issue.spare_id;
    const inventoryTable = isSpare ? "spares" : "tools";
    const inventoryId = issue.spare_id || issue.tool_id;

    /** 2. Fetch inventory box_no */
    const [[inventory]] = await pool.query(
      `SELECT box_no FROM ${inventoryTable} WHERE id = ?`,
      [inventoryId],
    );

    let boxes = JSON.parse(inventory.box_no || "[]");

    /** 3. Deposit qty back into inventory */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no.find((b) => b.no === box.no);
      if (match) {
        return {
          ...box,
          qtyHeld: (
            parseInt(box.qtyHeld || 0) + parseInt(match.deposit || 0)
          ).toString(),
        };
      }
      return box;
    });

    /** 4. Update inventory */
    await pool.query(`UPDATE ${inventoryTable} SET box_no = ? WHERE id = ?`, [
      JSON.stringify(updatedBoxes),
      inventoryId,
    ]);

    /** 5. Update temporary issue */
    await pool.query(
      `
      UPDATE temporary_issue_local
      SET
        qty_received = ?,
        return_date = ?,
        approved_by = ?,
        box_no = ?,
        approved_at = NOW()
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

    return res.json({
      success: true,
      message: "Item returned and inventory updated successfully",
    });
  } catch (error) {
    console.error("UPDATE TEMP ISSUE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  createTemporaryIssue,
  getTemporaryIssueList,
  updateTemporaryIssue,
};
