const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

// const formatDateForMySQL = (date) => {
//   if (!date) return null;
//   if (date instanceof Date) {
//     return date.toISOString().split("T")[0];
//   }
//   if (typeof date === "string") {
//     const parsedDate = new Date(date);
//     if (!isNaN(parsedDate.getTime())) {
//       return parsedDate.toISOString().split("T")[0];
//     }
//   }
//   return null;
// };

function formatDateForMySQL(date) {
  if (!date) return null;
  
  // If date is a string, convert it to Date object first
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(d.getTime())) return null;
  
  // Format as YYYY-MM-DD using local date components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// OLD LOGIC Create-STOREDEM-OPDEM-Demand
// async function createStoredemDemand(req, res) {
//   const { id: userId, name } = req.user;

//   try {
//     const {
//       spare_id,
//       tool_id,
//       quantity,
//       demand_type,
//       mo_demand_no,
//       mo_demand_date,
//     } = req.body;

//     // Validate demand type
//     if (!demand_type || !["STOREDEM", "OPDEM"].includes(demand_type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid demand type (STOREDEM or OPDEM) is required",
//       });
//     }

//     // Validate category (should be P, R, or C)
//     let category = null;
//     if (spare_id) {
//       const [spare] = await pool.query(
//         "SELECT category FROM spares WHERE id = ?",
//         [spare_id],
//       );
//       category = spare[0]?.category;
//     } else if (tool_id) {
//       const [tool] = await pool.query(
//         "SELECT category FROM tools WHERE id = ?",
//         [tool_id],
//       );
//       category = tool[0]?.category;
//     }

//     if (!category || !["P", "R", "C"].includes(category)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only P, R, and C category spares/tools can be enrolled under STOREDEM/OPDEM",
//       });
//     }

//     if (!quantity || quantity <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid quantity is required",
//       });
//     }

//     const transaction_id = `${demand_type}-${Date.now()}`;

//     const query = `
//       INSERT INTO storedem_special_demand (
//         spare_id, tool_id, quantity, demand_type,
//         mo_demand_no, mo_demand_date,
//         created_by, created_by_name, transaction_id, status
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
//     `;

//     const [result] = await pool.query(query, [
//       spare_id || null,
//       tool_id || null,
//       quantity,
//       demand_type,
//       mo_demand_no || null,
//       mo_demand_date ? formatDateForMySQL(mo_demand_date) : null,
//       userId,
//       name,
//       transaction_id,
//     ]);

//     // If MO Demand No is filled, move to pending_issue immediately
//     if (mo_demand_no) {
//       await moveToPendingIssue(result.insertId);
//     }

//     res.status(201).json({
//       success: true,
//       message: `${demand_type} Demand added successfully`,
//       data: { id: result.insertId },
//     });
//   } catch (error) {
//     console.error("CREATE STOREDEM DEMAND ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// }

// Create STOREDEM/OPDEM Demand
async function createStoredemDemand(req, res) {
  const { id: userId, name } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      quantity,
      demand_type,
      mo_demand_no,
      mo_demand_date,
    } = req.body;

    // Validate demand type
    if (!demand_type || !["STOREDEM", "OPDEM"].includes(demand_type)) {
      return res.status(400).json({
        success: false,
        message: "Valid demand type (STOREDEM or OPDEM) is required",
      });
    }

    // Validate category (should be P, R, or C)
    let category = null;
    if (spare_id) {
      const [spare] = await pool.query(
        "SELECT category FROM spares WHERE id = ?",
        [spare_id],
      );
      category = spare[0]?.category;
    } else if (tool_id) {
      const [tool] = await pool.query(
        "SELECT category FROM tools WHERE id = ?",
        [tool_id],
      );
      category = tool[0]?.category;
    }

    if (!category || !["P", "R", "C"].includes(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Only P, R, and C category spares/tools can be enrolled under STOREDEM/OPDEM",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const transaction_id = `${demand_type}-${Date.now()}`;

    const query = `
      INSERT INTO storedem_special_demand (
        spare_id, tool_id, quantity, demand_type,
        mo_demand_no, mo_demand_date,
        created_by, created_by_name, transaction_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(query, [
      spare_id || null,
      tool_id || null,
      quantity,
      demand_type,
      mo_demand_no || null,
      mo_demand_date ? formatDateForMySQL(mo_demand_date) : null,
      userId,
      name,
      transaction_id,
    ]);

    // REMOVED: Do NOT move to pending_issue here anymore
    // The move to pending_issue should only happen in updateStoredemDemand
    // when MO Demand Details are added

    res.status(201).json({
      success: true,
      message: `${demand_type} Demand added successfully`,
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("CREATE STOREDEM DEMAND ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// OLD LOGIC MOVE-TO-PENDING-ISSUE
// async function moveToPendingIssue(storedemDemandId) {
//   const [demand] = await pool.query(
//     `SELECT * FROM storedem_special_demand WHERE id = ?`,
//     [storedemDemandId],
//   );

//   if (!demand[0]) return;

//   const sd = demand[0];

//   await pool.query(
//     `INSERT INTO pending_issue (
//       spare_id, tool_id, demand_no, demand_date, demand_quantity,
//       requisition_no, requisition_date, mo_no, mo_date,
//       created_by, created_at, status, transaction_id, source_type,
//       storedem_demand_id, demand_type
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, 'storedem', ?, ?)`,
//     [
//       sd.spare_id || null,
//       sd.tool_id || null,
//       sd.transaction_id,
//       sd.created_at,
//       sd.quantity,
//       null,
//       null,
//       sd.mo_demand_no,
//       sd.mo_demand_date,
//       sd.created_by,
//       sd.transaction_id,
//       sd.id,
//       sd.demand_type,
//     ],
//   );
// }

async function moveToPendingIssue(storedemDemandId) {
  const [demand] = await pool.query(
    `SELECT * FROM storedem_special_demand WHERE id = ?`,
    [storedemDemandId],
  );

  if (!demand[0]) return;

  const sd = demand[0];

  // Determine the remarks value based on demand_type
  const remarksValue =
    sd.demand_type === "STOREDEM"
      ? "STOREDEM"
      : sd.demand_type === "OPDEM"
        ? "OPDEM"
        : sd.demand_type || null;

  await pool.query(
    `INSERT INTO pending_issue (
      spare_id, tool_id, demand_no, demand_date, demand_quantity,
      requisition_no, requisition_date, mo_no, mo_date,
      created_by, created_at, status, transaction_id, source_type, 
      storedem_demand_id, demand_type, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, 'storedem', ?, ?, ?)`,
    [
      sd.spare_id || null,
      sd.tool_id || null,
      sd.mo_demand_no, // Changed: Store mo_demand_no as demand_no instead of transaction_id
      sd.mo_demand_date, // Changed: Use mo_demand_date as demand_date
      sd.quantity,
      null,
      null,
      sd.mo_demand_no, // mo_no remains the same
      sd.mo_demand_date, // mo_date remains the same
      sd.created_by,
      sd.transaction_id, // transaction_id still stored separately
      sd.id,
      sd.demand_type,
      remarksValue,
    ],
  );
}

// Get STOREDEM/OPDEM Demand List - Only show records that haven't been moved to pending_issue
async function getStoredemDemandList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];
  const demandType = req.query?.demand_type;

  const columnMap = {
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],
    denos: ["s.denos", "t.denos"],
    quantity: ["sd.quantity"],
    demand_type: ["sd.demand_type"],
    mo_demand_no: ["sd.mo_demand_no"],
    mo_demand_date: ["sd.mo_demand_date"],
  };

  let whereClause = `
    WHERE sd.status = 'pending'
  `;

  if (demandType) {
    whereClause += ` AND sd.demand_type = '${demandType}'`;
  }

  let searchParams = [];

  // Search functionality
  if (search) {
    let searchConditions = [];
    const validCols = rawCols.map((c) => c.trim()).filter((c) => columnMap[c]);
    const searchWords = search
      .split(/[,;\s]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    for (const word of searchWords) {
      let wordFragments = [];

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col];
          for (const dbCol of dbCols) {
            if (["quantity"].includes(col) && !isNaN(word)) {
              searchParams.push(Number(word));
              wordFragments.push(`${dbCol} = ?`);
            } else if (["mo_demand_date"].includes(col)) {
              searchParams.push(word);
              wordFragments.push(`DATE(${dbCol}) = ?`);
            } else {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }
          }
        }
      } else {
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
            s.description LIKE ? OR t.description LIKE ? OR
            s.indian_pattern LIKE ? OR t.indian_pattern LIKE ? OR
            sd.demand_type LIKE ? OR
            sd.mo_demand_no LIKE ? OR
            sd.created_by_name LIKE ?
          )
        `);
      }
      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }
    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }

  // Get total count
  const [totalCount] = await pool.query(
    `
    SELECT COUNT(sd.id) as count
    FROM storedem_special_demand sd
    LEFT JOIN spares s ON s.id = sd.spare_id
    LEFT JOIN tools t ON t.id = sd.tool_id
    ${whereClause}
    `,
    searchParams,
  );

  const total = totalCount[0].count;

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
        "No STOREDEM/OPDEM demand found",
      ),
    );
  }

  // Main query
  const query = `
    SELECT
      sd.id,
      sd.spare_id,
      sd.tool_id,
      sd.quantity,
      sd.demand_type,
      sd.mo_demand_no,
      sd.mo_demand_date,
      sd.created_by,
      sd.created_by_name,
      sd.created_at,
      sd.status,
      sd.transaction_id,
      CASE
        WHEN sd.spare_id IS NOT NULL THEN 'spares'
        WHEN sd.tool_id IS NOT NULL THEN 'tools'
        ELSE 'unknown'
      END AS source,
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
        WHEN sd.spare_id IS NOT NULL THEN s.denos
        WHEN sd.tool_id IS NOT NULL THEN t.denos
        ELSE NULL
      END AS denos
    FROM storedem_special_demand sd
    LEFT JOIN spares s ON s.id = sd.spare_id
    LEFT JOIN tools t ON t.id = sd.tool_id
    ${whereClause}
    ORDER BY sd.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...searchParams, limit, offset]);

  res.json(
    new ApiResponse(
      200,
      {
        items: rows,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      "STOREDEM/OPDEM demand list retrieved successfully",
    ),
  );
}

// Update STOREDEM/OPDEM Demand (add MO Demand No and move to pending_issue)
// async function updateStoredemDemand(req, res) {
//   const { id, mo_demand_no, mo_demand_date } = req.body;
//   const { id: userId } = req.user;

//   if (!id) {
//     return res.status(400).json({
//       success: false,
//       message: "STOREDEM/OPDEM Demand item ID is required for an update.",
//     });
//   }

//   if (!mo_demand_no) {
//     return res.status(400).json({
//       success: false,
//       message: "MO Demand No is required",
//     });
//   }

//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     // Get the demand details first
//     const [storedemDemand] = await connection.query(
//       "SELECT * FROM storedem_special_demand WHERE id = ?",
//       [id],
//     );

//     if (!storedemDemand[0]) {
//       return res.status(404).json({
//         success: false,
//         message: "Demand not found",
//       });
//     }

//     const sd = storedemDemand[0];

//     // Update the demand with MO Demand No and change status to 'issued' (or 'completed')
//     const updateQuery = `
//       UPDATE storedem_special_demand SET
//         mo_demand_no = ?,
//         mo_demand_date = ?,
//         status = 'issued'
//       WHERE id = ?
//     `;

//     await connection.query(updateQuery, [
//       mo_demand_no,
//       formatDateForMySQL(mo_demand_date),
//       id,
//     ]);

//     // Move to pending_issue
//     await connection.query(
//       `INSERT INTO pending_issue (
//         spare_id, tool_id, demand_no, demand_date, demand_quantity,
//         requisition_no, requisition_date, mo_no, mo_date,
//         created_by, created_at, status, transaction_id, source_type,
//         storedem_demand_id, demand_type
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, 'storedem', ?, ?)`,
//       [
//         sd.spare_id || null,
//         sd.tool_id || null,
//         sd.transaction_id,
//         sd.created_at,
//         sd.quantity,
//         null,
//         null,
//         mo_demand_no,
//         formatDateForMySQL(mo_demand_date),
//         userId,
//         sd.transaction_id,
//         id,
//         sd.demand_type,
//       ],
//     );

//     await connection.commit();

//     res.status(200).json({
//       success: true,
//       message: "Demand moved to Pending Issue successfully",
//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error("UPDATE STOREDEM DEMAND ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   } finally {
//     connection.release();
//   }
// }

async function updateStoredemDemand(req, res) {
  const { id, mo_demand_no, mo_demand_date } = req.body;
  const { id: userId } = req.user;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "STOREDEM/OPDEM Demand item ID is required for an update.",
    });
  }

  if (!mo_demand_no) {
    return res.status(400).json({
      success: false,
      message: "MO Demand No is required",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get the demand details first
    const [storedemDemand] = await connection.query(
      "SELECT * FROM storedem_special_demand WHERE id = ?",
      [id],
    );

    if (!storedemDemand[0]) {
      return res.status(404).json({
        success: false,
        message: "Demand not found",
      });
    }

    const sd = storedemDemand[0];

    // Determine the remarks value based on demand_type
    const remarksValue =
      sd.demand_type === "STOREDEM"
        ? "STOREDEM"
        : sd.demand_type === "OPDEM"
          ? "OPDEM"
          : sd.demand_type || null;

    // Update the demand with MO Demand No and change status to 'issued'
    const updateQuery = `
      UPDATE storedem_special_demand SET
        mo_demand_no = ?,
        mo_demand_date = ?,
        status = 'issued' 
      WHERE id = ?
    `;

    await connection.query(updateQuery, [
      mo_demand_no,
      formatDateForMySQL(mo_demand_date),
      id,
    ]);

    // Move to pending_issue
    await connection.query(
      `INSERT INTO pending_issue (
        spare_id, tool_id, demand_no, demand_date, demand_quantity,
        requisition_no, requisition_date, mo_no, mo_date,
        created_by, created_at, status, transaction_id, source_type, 
        storedem_demand_id, demand_type, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, 'storedem', ?, ?, ?)`,
      [
        sd.spare_id || null,
        sd.tool_id || null,
        mo_demand_no, // Changed: Store the new mo_demand_no as demand_no
        formatDateForMySQL(mo_demand_date), // Changed: Use mo_demand_date as demand_date
        sd.quantity,
        null,
        null,
        mo_demand_no, // mo_no also gets the same mo_demand_no
        formatDateForMySQL(mo_demand_date), // mo_date gets the same mo_demand_date
        userId,
        sd.transaction_id, // transaction_id still stored separately
        id,
        sd.demand_type,
        remarksValue,
      ],
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Demand moved to Pending Issue successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("UPDATE STOREDEM DEMAND ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  } finally {
    connection.release();
  }
}

// Update STOREDEM/OPDEM Inventory (when box no is added)
async function updateStoredemInventory(req, res) {
  const { id, box_no } = req.body;

  if (!id || !box_no) {
    return res.status(400).json({
      success: false,
      message: "Demand ID and box number are required",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get demand details
    const [storedemDemand] = await connection.query(
      "SELECT * FROM storedem_special_demand WHERE id = ?",
      [id],
    );

    if (!storedemDemand[0]) {
      return res.status(404).json({
        success: false,
        message: "Demand not found",
      });
    }

    const sd = storedemDemand[0];

    // Add to storedem_inventory
    await connection.query(
      `INSERT INTO storedem_inventory (
        storedem_demand_id, spare_id, tool_id, box_no, quantity, 
        status, issued_date
      ) VALUES (?, ?, ?, ?, ?, 'issued', CURDATE())`,
      [
        id,
        sd.spare_id || null,
        sd.tool_id || null,
        JSON.stringify(box_no),
        sd.quantity,
      ],
    );

    // For non-consumable items (P, R), move to pending_survey
    let category = null;
    if (sd.spare_id) {
      const [spare] = await connection.query(
        "SELECT category FROM spares WHERE id = ?",
        [sd.spare_id],
      );
      category = spare[0]?.category;
    } else if (sd.tool_id) {
      const [tool] = await connection.query(
        "SELECT category FROM tools WHERE id = ?",
        [sd.tool_id],
      );
      category = tool[0]?.category;
    }

    // If category is P or R, add to pending_survey
    if (category === "P" || category === "R") {
      await connection.query(
        `INSERT INTO pending_survey (
          spare_id, tool_id, quantity, demand_type, storedem_demand_id,
          created_at, status
        ) VALUES (?, ?, ?, ?, ?, NOW(), 'pending')`,
        [
          sd.spare_id || null,
          sd.tool_id || null,
          sd.quantity,
          sd.demand_type,
          id,
        ],
      );
    } else {
      // For consumable items (C), mark as completed directly
      await connection.query(
        `UPDATE storedem_special_demand SET status = 'completed' WHERE id = ?`,
        [id],
      );
    }

    // Update held or maintained qty based on category
    const tableName = sd.spare_id ? "spares" : "tools";
    const itemId = sd.spare_id || sd.tool_id;

    if (category === "P" || category === "R") {
      await connection.query(
        `UPDATE ${tableName} SET obs_held = obs_held + ? WHERE id = ?`,
        [sd.quantity, itemId],
      );
    } else if (category === "C") {
      await connection.query(
        `UPDATE ${tableName} SET obs_maintained = obs_maintained - ? WHERE id = ?`,
        [sd.quantity, itemId],
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message:
        category === "C"
          ? "Consumable item issued successfully"
          : "Item added to inventory and moved to Pending Survey",
    });
  } catch (error) {
    await connection.rollback();
    console.error("UPDATE STOREDEM INVENTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  } finally {
    connection.release();
  }
}

// Get STOREDEM/OPDEM Logs (Completed)
async function getStoredemLogs(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];
  const demandType = req.query?.demand_type;

  const columnMap = {
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],
    denos: ["s.denos", "t.denos"],
    quantity: ["sd.quantity"],
    demand_type: ["sd.demand_type"],
    mo_demand_no: ["sd.mo_demand_no"],
    mo_demand_date: ["sd.mo_demand_date"],
  };

  let whereClause = `
    WHERE sd.status != 'pending'
  `;

  if (demandType) {
    whereClause += ` AND sd.demand_type = '${demandType}'`;
  }

  let searchParams = [];

  if (search) {
    let searchConditions = [];
    const validCols = rawCols.map((c) => c.trim()).filter((c) => columnMap[c]);
    const searchWords = search
      .split(/[,;\s]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    for (const word of searchWords) {
      let wordFragments = [];

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col];
          for (const dbCol of dbCols) {
            if (["quantity"].includes(col) && !isNaN(word)) {
              searchParams.push(Number(word));
              wordFragments.push(`${dbCol} = ?`);
            } else if (["mo_demand_date"].includes(col)) {
              searchParams.push(word);
              wordFragments.push(`DATE(${dbCol}) = ?`);
            } else {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }
          }
        }
      } else {
        searchParams.push(
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
        );
        wordFragments.push(`
          (
            s.description LIKE ? OR t.description LIKE ? OR
            s.indian_pattern LIKE ? OR t.indian_pattern LIKE ? OR
            sd.demand_type LIKE ? OR
            sd.mo_demand_no LIKE ? OR
            sd.created_by_name LIKE ?
          )
        `);
      }
      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }
    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }

  const [totalCount] = await pool.query(
    `
    SELECT COUNT(sd.id) as count
    FROM storedem_special_demand sd
    LEFT JOIN spares s ON s.id = sd.spare_id
    LEFT JOIN tools t ON t.id = sd.tool_id
    ${whereClause}
    `,
    searchParams,
  );

  const total = totalCount[0].count;

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
        "No completed records found",
      ),
    );
  }

  const query = `
    SELECT
      sd.id,
      sd.spare_id,
      sd.tool_id,
      sd.quantity,
      sd.demand_type,
      sd.mo_demand_no,
      sd.mo_demand_date,
      sd.created_by,
      sd.created_by_name,
      sd.created_at,
      sd.status,
      sd.transaction_id,
      CASE
        WHEN sd.spare_id IS NOT NULL THEN 'spares'
        WHEN sd.tool_id IS NOT NULL THEN 'tools'
        ELSE 'unknown'
      END AS source,
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
        WHEN sd.spare_id IS NOT NULL THEN s.denos
        WHEN sd.tool_id IS NOT NULL THEN t.denos
        ELSE NULL
      END AS denos
    FROM storedem_special_demand sd
    LEFT JOIN spares s ON s.id = sd.spare_id
    LEFT JOIN tools t ON t.id = sd.tool_id
    ${whereClause}
    ORDER BY sd.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...searchParams, limit, offset]);

  res.json(
    new ApiResponse(
      200,
      {
        items: rows,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      "Completed records retrieved successfully",
    ),
  );
}

// Get items for STOREDEM/OPDEM selection
async function getStoredemItems(req, res) {
  try {
    const { search = "", limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        id, 
        description, 
        category, 
        denos,
        'spare' AS type,
        indian_pattern,
        item_code,
        equipment_system
      FROM spares 
      WHERE category IN ('P', 'R', 'C')
      
      UNION ALL
      
      SELECT 
        id, 
        description, 
        category, 
        denos,
        'tool' AS type,
        indian_pattern,
        item_code,
        equipment_system
      FROM tools 
      WHERE category IN ('P', 'R', 'C')
    `;

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = `
        SELECT * FROM (
          ${query}
        ) AS combined
        WHERE description LIKE ? 
           OR indian_pattern LIKE ? 
           OR item_code LIKE ? 
           OR equipment_system LIKE ?
        ORDER BY description ASC
      `;

      const [rows] = await pool.query(query, [
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      ]);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: rows.slice(0, 500),
            totalItems: rows.length,
            hasMore: rows.length > 500,
          },
          "Items fetched successfully",
        ),
      );
    }

    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM spares WHERE category IN ('P', 'R', 'C')
        UNION ALL
        SELECT id FROM tools WHERE category IN ('P', 'R', 'C')
      ) AS combined
    `;
    const [countResult] = await pool.query(countQuery);
    const totalItems = countResult[0].total;

    query += ` ORDER BY description ASC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(query, [parseInt(limit), offset]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / parseInt(limit)),
          hasMore: offset + rows.length < totalItems,
        },
        "Items fetched successfully",
      ),
    );
  } catch (error) {
    console.error("GET STOREDEM ITEMS ERROR:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  createStoredemDemand,
  getStoredemDemandList,
  updateStoredemDemand,
  updateStoredemInventory,
  getStoredemLogs,
  getStoredemItems,
};
