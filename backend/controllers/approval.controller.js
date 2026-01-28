const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function getAllApprovalPendings(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) AS total
        FROM approval
        WHERE status = 'pending' AND field_name = 'obs_authorised'
      `
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
      `SELECT 
  a.id,
  a.spares_id,
  a.tools_id,
  s.description AS spares_description,
  t.description AS tools_description,
  a.field_name,
  a.old_value,
  a.new_value,
  a.status,
  a.created_at,
  a.action_by,
  u.name AS requested_by,
  CASE
    WHEN a.spares_id IS NULL AND a.tools_id IS NOT NULL THEN 'tools'
    WHEN a.tools_id IS NULL AND a.spares_id IS NOT NULL THEN 'spares'
    ELSE 'unknown'
  END AS source
FROM approval a
LEFT JOIN spares s ON s.id = a.spares_id
LEFT JOIN tools t ON t.id = a.tools_id
JOIN users u ON u.id = a.created_by
WHERE a.status = 'pending'
  AND a.field_name = 'obs_authorised' 
ORDER BY a.created_at DESC
LIMIT ? OFFSET ?;
`,
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
        "Item retrieved successfully"
      )
    );
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

// async function approveChange(req, res) {
//   const { approvalId, source } = req.params;

//   const [[approval]] = await pool.query(
//     `SELECT * FROM approval WHERE id = ? AND status = 'pending'`, // UPDATE ${source} set obs_authorised = ? where id = ?
//     [approvalId]
//   );

//   if (!approval) {
//     return res
//       .status(404)
//       .json(new ApiErrorResponse(404, {}, "Approval not found"));
//   }

//   // Apply approved value
//   await pool.query(
//     `UPDATE spares SET ${approval.field_name} = ? WHERE id = ?`,
//     [approval.new_value, approval.spares_id]
//   );

//   // Mark approval as approved
//   await pool.query(
//     `
//     UPDATE approval
//     SET status = 'approved',
//         action_by = ?,
//         action_at = NOW()
//     WHERE id = ?
//     `,
//     [req.user.id, approvalId]
//   );

//   // put new value in the respected table

//   res.status(200).json(new ApiResponse(200, {}, "Approved successfully"));
// }

async function approveChange(req, res) {
  const { id } = req.params;

  let [approval] = await pool.query(
    `SELECT * FROM approval WHERE id = ? AND status = 'pending'`,
    [id]
  );
  approval = approval[0];

  console.log(approval, id);

  if (!approval) {
    return res
      .status(404)
      .json(new ApiErrorResponse(404, {}, "Approval not found"));
  }

  // Decide source table
  let tableName, recordId;

  if (approval.spares_id) {
    tableName = "spares";
    recordId = approval.spares_id;
  } else if (approval.tools_id) {
    tableName = "tools";
    recordId = approval.tools_id;
  } else {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "Invalid approval source"));
  }

  // Apply approved value
  await pool.query(
    `UPDATE ${tableName}
     SET ${approval.field_name} = ?
     WHERE id = ?`,
    [approval.new_value, recordId]
  );

  // Mark approval as approved
  await pool.query(
    `
      UPDATE approval
      SET status = 'approved',
          action_by = ?,
          action_at = NOW()
      WHERE id = ?
    `,
    [req.user.id, id]
  );

  res.status(200).json(new ApiResponse(200, {}, "Approved successfully"));
}

async function rejectChange(req, res) {
  const { id } = req.params;

  await pool.query(
    `
    UPDATE approval
    SET status = 'rejected',
        action_by = ?,
        action_at = NOW()
    WHERE id = ?
    `,
    [req.user.id, id]
  );

  res.status(200).json(new ApiResponse(200, {}, "Rejected successfully"));
}

async function worklistHistory(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) AS total
        FROM approval
      `
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
      `SELECT 
  a.id,
  a.spares_id,
  a.tools_id,
  s.description AS spares_description,
  t.description AS tools_description,
  a.field_name,
  a.old_value,
  a.new_value,
  a.status,
  a.created_at,
  a.action_at,
  u.name AS requested_by,
  ua.name AS action_by_name,
  CASE
    WHEN a.spares_id IS NULL AND a.tools_id IS NOT NULL THEN 'tools'
    WHEN a.tools_id IS NULL AND a.spares_id IS NOT NULL THEN 'spares'
    ELSE 'unknown'
  END AS source
FROM approval a
LEFT JOIN spares s ON s.id = a.spares_id
LEFT JOIN tools t ON t.id = a.tools_id
JOIN users u ON u.id = a.created_by
LEFT JOIN users ua ON ua.id = a.action_by
ORDER BY a.created_at DESC
LIMIT ? OFFSET ?;
`,
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
        "Item retrieved successfully"
      )
    );
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  approveChange,
  rejectChange,
  getAllApprovalPendings,
  worklistHistory,
};
