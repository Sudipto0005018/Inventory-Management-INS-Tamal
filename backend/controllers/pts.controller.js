const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

// Create PTS Demand
async function createPTSDemand(req, res) {
  const { id: userId, name } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      quantity,
      internal_demand_no,
      internal_demand_date,
      requisition_no,
      requisition_date,
      mo_demand_no,
      mo_demand_date,
    } = req.body;

    // Helper function to format dates properly
    const formatDateForMySQL = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      if (typeof date === "string") {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split("T")[0];
        }
      }
      return null;
    };

    // Validate category (should be P or R)
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

    if (!category || !["P", "R"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Only P and R category spares/tools can be enrolled under PTS",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const transaction_id = "PTS-" + Date.now();

    const formattedInternalDemandDate =
      formatDateForMySQL(internal_demand_date);
    const formattedRequisitionDate = formatDateForMySQL(requisition_date);
    const formattedMoDate = formatDateForMySQL(mo_demand_date);

    const query = `
      INSERT INTO pts_special_demand (
        spare_id, tool_id, quantity,
        internal_demand_no, internal_demand_date,
        requisition_no, requisition_date,
        mo_demand_no, mo_demand_date,
        created_by, created_by_name, transaction_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(query, [
      spare_id || null,
      tool_id || null,
      quantity,
      internal_demand_no || null,
      formattedInternalDemandDate,
      requisition_no || null,
      formattedRequisitionDate,
      mo_demand_no || null,
      formattedMoDate,
      userId,
      name,
      transaction_id,
    ]);

    // If all demand fields are filled, move to pending_issue
    if (internal_demand_no && requisition_no && mo_demand_no) {
      await moveToPendingIssue(result.insertId);
    }

    res.status(201).json({
      success: true,
      message: "PTS Demand added successfully",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("CREATE PTS DEMAND ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Move PTS to Pending Issue when MO Demand No is added
async function moveToPendingIssue(ptsDemandId) {
  const [demand] = await pool.query(
    `SELECT * FROM pts_special_demand WHERE id = ?`,
    [ptsDemandId],
  );

  if (!demand[0]) return;

  const pts = demand[0];

  await pool.query(
    `INSERT INTO pending_issue (
      spare_id, tool_id, demand_no, demand_date, demand_quantity,
      requisition_no, requisition_date, mo_no, mo_date,
      created_by, created_at, status, transaction_id, source_type, is_pts, pts_demand_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, 'pts', 1, ?)`,
    [
      pts.spare_id || null,
      pts.tool_id || null,
      pts.internal_demand_no,
      pts.internal_demand_date,
      pts.quantity,
      pts.requisition_no,
      pts.requisition_date,
      pts.mo_demand_no,
      pts.mo_demand_date,
      pts.created_by,
      pts.transaction_id,
      pts.id,
    ],
  );
}

// Get PTS Demand List (Pending - not all fields filled)
async function getPTSDemandList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],
    denos: ["s.denos", "t.denos"],
    quantity: ["pts.quantity"],
    internal_demand_no: ["pts.internal_demand_no"],
    internal_demand_date: ["pts.internal_demand_date"],
    requisition_no: ["pts.requisition_no"],
    requisition_date: ["pts.requisition_date"],
    mo_demand_no: ["pts.mo_demand_no"],
    mo_demand_date: ["pts.mo_demand_date"],
  };

  // Only show records that don't have MO Demand No yet
  let whereClause = `
    WHERE pts.status = 'pending'
      AND pts.mo_demand_no IS NULL
  `;

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
            } else if (
              [
                "internal_demand_date",
                "requisition_date",
                "mo_demand_date",
              ].includes(col)
            ) {
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
            pts.internal_demand_no LIKE ? OR
            pts.requisition_no LIKE ? OR
            pts.created_by_name LIKE ?
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
    SELECT COUNT(pts.id) as count
    FROM pts_special_demand pts
    LEFT JOIN spares s ON s.id = pts.spare_id
    LEFT JOIN tools t ON t.id = pts.tool_id
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
        "No PTS demand found",
      ),
    );
  }

  // Main query
  const query = `
    SELECT
      pts.id,
      pts.spare_id,
      pts.tool_id,
      pts.quantity,
      pts.internal_demand_no,
      pts.internal_demand_date,
      pts.requisition_no,
      pts.requisition_date,
      pts.mo_demand_no,
      pts.mo_demand_date,
      pts.created_by,
      pts.created_by_name,
      pts.created_at,
      pts.status,
      pts.transaction_id,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN 'spares'
        WHEN pts.tool_id IS NOT NULL THEN 'tools'
        ELSE 'unknown'
      END AS source,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.description
        WHEN pts.tool_id IS NOT NULL THEN t.description
        ELSE NULL
      END AS description,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.indian_pattern
        WHEN pts.tool_id IS NOT NULL THEN t.indian_pattern
        ELSE NULL
      END AS indian_pattern,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.category
        WHEN pts.tool_id IS NOT NULL THEN t.category
        ELSE NULL
      END AS category,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.denos
        WHEN pts.tool_id IS NOT NULL THEN t.denos
        ELSE NULL
      END AS denos
    FROM pts_special_demand pts
    LEFT JOIN spares s ON s.id = pts.spare_id
    LEFT JOIN tools t ON t.id = pts.tool_id
    ${whereClause}
    ORDER BY pts.created_at DESC
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
      "PTS demand list retrieved successfully",
    ),
  );
}

// Get items (spares + tools) for PTS selection
async function getPTSItems(req, res) {
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
      WHERE category IN ('P', 'R')
      
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
      WHERE category IN ('P', 'R')
    `;

    // Add search condition if search term provided
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

    // Without search, return paginated results
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM spares WHERE category IN ('P', 'R')
        UNION ALL
        SELECT id FROM tools WHERE category IN ('P', 'R')
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
    console.error("GET PTS ITEMS ERROR:", error);
    res.status(500).json(
      new ApiErrorResponse(500, {}, "Internal server error")
    );
  }
}

// Update PTS Demand (add Internal Demand, Requisition, MO Demand)
async function updatePTSDemand(req, res) {
  const {
    id,
    internal_demand_no,
    internal_demand_date,
    requisition_no,
    requisition_date,
    mo_demand_no,
    mo_demand_date,
  } = req.body;

  const { id: userId } = req.user;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "PTS Demand item ID is required for an update.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Helper function to format dates properly
    const formatDateForMySQL = (date) => {
      if (!date) return null;
      // If it's a Date object
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      // If it's a string, try to parse it
      if (typeof date === "string") {
        // Remove timezone info and get just the date part
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split("T")[0];
        }
      }
      return null;
    };

    // Update the PTS demand
    const updateQuery = `
      UPDATE pts_special_demand SET
        internal_demand_no = ?,
        internal_demand_date = ?,
        requisition_no = ?,
        requisition_date = ?,
        mo_demand_no = ?,
        mo_demand_date = ?
      WHERE id = ?
    `;

    await connection.query(updateQuery, [
      internal_demand_no || null,
      formatDateForMySQL(internal_demand_date),
      requisition_no || null,
      formatDateForMySQL(requisition_date),
      mo_demand_no || null,
      formatDateForMySQL(mo_demand_date),
      id,
    ]);

    // Check if MO Demand No is now filled
    if (mo_demand_no) {
      // Get PTS demand details
      const [ptsDemand] = await connection.query(
        "SELECT * FROM pts_special_demand WHERE id = ?",
        [id],
      );

      if (ptsDemand[0]) {
        const pts = ptsDemand[0];

        // Format dates for pending_issue insertion
        const formattedDemandDate = formatDateForMySQL(
          internal_demand_date || pts.internal_demand_date,
        );
        const formattedRequisitionDate = formatDateForMySQL(
          requisition_date || pts.requisition_date,
        );
        const formattedMoDate = formatDateForMySQL(
          mo_demand_date || pts.mo_demand_date,
        );

        await connection.query(
          `INSERT INTO pending_issue (
            spare_id, tool_id, demand_no, demand_date, demand_quantity,
            requisition_no, requisition_date, mo_no, mo_date,
            created_by, created_at, status, transaction_id, source_type, is_pts, pts_demand_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, 'pts', 1, ?)`,
          [
            pts.spare_id || null,
            pts.tool_id || null,
            internal_demand_no || pts.internal_demand_no,
            formattedDemandDate,
            pts.quantity,
            requisition_no || pts.requisition_no,
            formattedRequisitionDate,
            mo_demand_no,
            formattedMoDate,
            userId,
            pts.transaction_id,
            id,
          ],
        );
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: mo_demand_no
        ? "PTS Demand moved to Pending Issue"
        : "PTS Demand updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("UPDATE PTS DEMAND ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  } finally {
    connection.release();
  }
}

// Update PTS Inventory (when box no is added)
async function updatePTSInventory(req, res) {
  const { id, box_no, source, uid } = req.body;

  if (!id || !box_no) {
    return res.status(400).json({
      success: false,
      message: "PTS Demand ID and box number are required",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get PTS demand details
    const [ptsDemand] = await connection.query(
      "SELECT * FROM pts_special_demand WHERE id = ?",
      [id],
    );

    if (!ptsDemand[0]) {
      return res.status(404).json({
        success: false,
        message: "PTS Demand not found",
      });
    }

    const pts = ptsDemand[0];

    // Add to pts_inventory
    await connection.query(
      `INSERT INTO pts_inventory (
        pts_demand_id, spare_id, tool_id, box_no, quantity, 
        status, issued_date
      ) VALUES (?, ?, ?, ?, ?, 'issued', CURDATE())`,
      [
        id,
        pts.spare_id || null,
        pts.tool_id || null,
        JSON.stringify(box_no),
        pts.quantity,
      ],
    );

    // Update held qty in spares/tools table
    const tableName = pts.spare_id ? "spares" : "tools";
    const itemId = pts.spare_id || pts.tool_id;

    await connection.query(
      `UPDATE ${tableName} SET obs_held = obs_held + ? WHERE id = ?`,
      [pts.quantity, itemId],
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "PTS item added to inventory successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("UPDATE PTS INVENTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  } finally {
    connection.release();
  }
}

// Get PTS Logs (Completed - all fields filled)
async function getPTSLogs(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],
    denos: ["s.denos", "t.denos"],
    quantity: ["pts.quantity"],
    internal_demand_no: ["pts.internal_demand_no"],
    internal_demand_date: ["pts.internal_demand_date"],
    requisition_no: ["pts.requisition_no"],
    requisition_date: ["pts.requisition_date"],
    mo_demand_no: ["pts.mo_demand_no"],
    mo_demand_date: ["pts.mo_demand_date"],
  };

  let whereClause = `
    WHERE pts.status = 'pending'
      AND pts.mo_demand_no IS NOT NULL
  `;

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
            } else if (
              [
                "internal_demand_date",
                "requisition_date",
                "mo_demand_date",
              ].includes(col)
            ) {
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
            pts.internal_demand_no LIKE ? OR
            pts.requisition_no LIKE ? OR
            pts.created_by_name LIKE ?
          )
        `);
      }
      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }
    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }

  const [totalCount] = await pool.query(
    `
    SELECT COUNT(pts.id) as count
    FROM pts_special_demand pts
    LEFT JOIN spares s ON s.id = pts.spare_id
    LEFT JOIN tools t ON t.id = pts.tool_id
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
        "No completed PTS records found",
      ),
    );
  }

  const query = `
    SELECT
      pts.id,
      pts.spare_id,
      pts.tool_id,
      pts.quantity,
      pts.internal_demand_no,
      pts.internal_demand_date,
      pts.requisition_no,
      pts.requisition_date,
      pts.mo_demand_no,
      pts.mo_demand_date,
      pts.created_by,
      pts.created_by_name,
      pts.created_at,
      pts.status,
      pts.transaction_id,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN 'spares'
        WHEN pts.tool_id IS NOT NULL THEN 'tools'
        ELSE 'unknown'
      END AS source,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.description
        WHEN pts.tool_id IS NOT NULL THEN t.description
        ELSE NULL
      END AS description,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.indian_pattern
        WHEN pts.tool_id IS NOT NULL THEN t.indian_pattern
        ELSE NULL
      END AS indian_pattern,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.category
        WHEN pts.tool_id IS NOT NULL THEN t.category
        ELSE NULL
      END AS category,
      CASE
        WHEN pts.spare_id IS NOT NULL THEN s.denos
        WHEN pts.tool_id IS NOT NULL THEN t.denos
        ELSE NULL
      END AS denos
    FROM pts_special_demand pts
    LEFT JOIN spares s ON s.id = pts.spare_id
    LEFT JOIN tools t ON t.id = pts.tool_id
    ${whereClause}
    ORDER BY pts.created_at DESC
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
      "Completed PTS records retrieved successfully",
    ),
  );
}

module.exports = {
  createPTSDemand,
  getPTSDemandList,
  updatePTSDemand,
  updatePTSInventory,
  getPTSLogs,
  getPTSItems
};
