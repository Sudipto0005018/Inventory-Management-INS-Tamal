const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function createSpecialDemand(req, res) {
  const { id: userId, name } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      obs_authorised,
      obs_increase_qty,
      internal_demand_no,
      internal_demand_date,
      requisition_no,
      requisition_date,
      mo_demand_no,
      mo_demand_date,
      box_no,
      quoteAuthority,
    } = req.body;

    console.log("REQ.BODY =>", req.body);
    const transaction_id = "SD-" + Date.now();

    // 🔹 check if ALL 6 fields are filled
    const allDemandFieldsFilled =
      internal_demand_no &&
      internal_demand_date &&
      requisition_no &&
      requisition_date &&
      mo_demand_no &&
      mo_demand_date;

    /* =====================================================
       CASE 1: All fields present → INSERT INTO pending_issue
       ===================================================== */
    if (allDemandFieldsFilled) {
      const pendingIssueQuery = `
        INSERT INTO pending_issue (
          spare_id,
          tool_id,
          demand_no,
          demand_date,
          demand_quantity,
          requisition_no,
          requisition_date,
          mo_no,
          mo_date,
          quote_authority,  
          created_by,
          created_at,
          status,
          transaction_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?)
      `;

      await pool.query(pendingIssueQuery, [
        spare_id || null,
        tool_id || null,

        internal_demand_no,
        internal_demand_date,
        obs_increase_qty,

        requisition_no,
        requisition_date,
        mo_demand_no,
        mo_demand_date,

        quoteAuthority || null,
        userId,
        transaction_id,
      ]);
    } else {
      /* =====================================================
         CASE 2: Any field missing → INSERT INTO special_demand
         ===================================================== */
      const specialDemandQuery = `
      INSERT INTO special_demand (
        spare_id,
        tool_id,
        obs_authorised,
        obs_increase_qty,
        internal_demand_no,
        internal_demand_date,
        requisition_no,
        requisition_date,
        mo_demand_no,
        mo_demand_date,
        quote_authority, 
        created_by,
        created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.query(specialDemandQuery, [
        spare_id || null,
        tool_id || null,
        obs_authorised,
        obs_increase_qty,
        internal_demand_no || null,
        internal_demand_date || null,
        requisition_no || null,
        requisition_date || null,
        mo_demand_no || null,
        mo_demand_date || null,
        quoteAuthority || null,
        userId,
        name,
      ]);
    }
    await pool.query(
      `UPDATE ${spare_id ? "spares" : "tools"} SET box_no = ?, obs_authorised=? WHERE id = ?`,
      [
        typeof box_no == "string" ? box_no : JSON.stringify(box_no),
        obs_authorised,
        spare_id || tool_id,
      ],
    );

    res.json({
      success: true,
      message: "Inserted directly into Pending Issue",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getSpecialDemandList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],

    quantity: ["sd.obs_increase_qty"],
    obs_authorised: ["sd.obs_authorised"],
    quote_authority: ["sd.quote_authority"],

    internal_demand_no: ["sd.internal_demand_no"],
    internal_demand_date: ["sd.internal_demand_date"],

    requisition_no: ["sd.requisition_no"],
    requisition_date: ["sd.requisition_date"],

    modemand: ["sd.mo_demand_no"],
    modate: ["sd.mo_demand_date"],

    // created_at: ["sd.created_at"],
  };

  /* ---------------- BASE WHERE ---------------- */
  let whereClause = `
    WHERE 
      (sd.internal_demand_no IS NULL 
      OR sd.requisition_no IS NULL 
      OR sd.mo_demand_no IS NULL)
  `;
  let searchParams = [];

  /* ---------------- SEARCH WHERE ---------------- */
  if (search) {
    let searchConditions = [];

    const validCols = rawCols.map((c) => c.trim()).filter((c) => columnMap[c]);

    // Split by comma OR space
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
            // Numeric fields
            if (["quantity"].includes(col) && !isNaN(word)) {
              searchParams.push(Number(word));
              wordFragments.push(`${dbCol} = ?`);
            }

            // Date fields
            else if (
              ["internal_demand_date", "requisition_date", "modate"].includes(
                col,
              )
            ) {
              searchParams.push(word);
              wordFragments.push(`DATE(${dbCol}) = ?`);
            }

            // Default LIKE
            else {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }
          }
        }
      } else {
        // Default global search
        searchParams.push(
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
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
          OR s.indian_pattern LIKE ?
          OR t.indian_pattern LIKE ?
          OR s.category LIKE ?
          OR t.category LIKE ?
          OR sd.internal_demand_no LIKE ?
          OR sd.requisition_no LIKE ?
          OR sd.mo_demand_no LIKE ?
          OR sd.created_by_name LIKE ?
        )
      `);
      }

      // Each word must match somewhere
      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }

    // Combine words with AND
    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }
  // const searchParams = search ? Array(10).fill(`%${search}%`) : [];

  /* ---------------- TOTAL COUNT ---------------- */
  const [totalCount] = await pool.query(
    `
    SELECT COUNT(sd.id) as count
    FROM special_demand sd
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
        "No spare found",
      ),
    );
  }

  /* ---------------- MAIN QUERY ---------------- */
  try {
    const query = `
      SELECT
        sd.id,
        sd.spare_id,
        sd.tool_id,

        sd.obs_authorised,
        sd.obs_increase_qty,

        sd.internal_demand_no,
        sd.internal_demand_date,
        sd.requisition_no,
        sd.requisition_date,
        sd.mo_demand_no,
        sd.mo_demand_date,
        sd.quote_authority,

        sd.created_by,
        sd.created_by_name,
        sd.created_at,

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
        END AS category

      FROM special_demand sd
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
        "Special demand list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET SPECIAL DEMAND ERROR =>", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch special demand list",
    });
  }
}

async function updateSpecialDemand(req, res) {
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
      message: "Special Demand item ID is required for an update.",
    });
  }
  const connection = await pool.getConnection();
  try {
    const allDemandFieldsFilled =
      internal_demand_no &&
      internal_demand_date &&
      requisition_no &&
      requisition_date &&
      mo_demand_no &&
      mo_demand_date;
    if (allDemandFieldsFilled) {
      const getSpecialDemandQuery = "SELECT * FROM special_demand WHERE id = ?";
      const [specialDemandRows] = await connection.query(
        getSpecialDemandQuery,
        [id],
      );

      if (!specialDemandRows.length) {
        return res.status(404).json({
          success: false,
          message: "Special Demand not found",
        });
      }
      const specialDemand = specialDemandRows[0];

      const pendingIssueQuery = `
              INSERT INTO pending_issue (
                spare_id, tool_id, demand_no, demand_date, demand_quantity,
                requisition_no, requisition_date, mo_no, mo_date, created_by, created_at, status, transaction_id, source_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, ?)
            `;

      await connection.query(pendingIssueQuery, [
        specialDemand.spare_id || null,
        specialDemand.tool_id || null,
        internal_demand_no,
        internal_demand_date,
        specialDemand.obs_increase_qty,
        requisition_no,
        requisition_date,
        mo_demand_no,
        mo_demand_date,
        userId,
        "SD-" + Date.now(),
        "special_demand",
      ]);
    }
    const query = `
              UPDATE special_demand SET
                internal_demand_no = ?, internal_demand_date = ?,
                requisition_no = ?, requisition_date = ?,
                mo_demand_no = ?, mo_demand_date = ?
              WHERE id = ?
            `;
    await connection.query(query, [
      internal_demand_no || null,
      internal_demand_date || null,
      requisition_no || null,
      requisition_date || null,
      mo_demand_no || null,
      mo_demand_date || null,
      id,
    ]);

    await connection.commit();
    res.status(200).json({ success: true, message: "Updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.log("UPDATE SPECIAL DEMAND ERROR =>", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
}

async function getLogsSpecialDemand(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];

  /* ---------- BASE WHERE (Completed Records) ---------- */
  let whereClause = `
    WHERE 
      sd.internal_demand_no IS NOT NULL
      AND sd.requisition_no IS NOT NULL
      AND sd.mo_demand_no IS NOT NULL
  `;

  /* ---------- SEARCH FILTER ---------- */
  /* ---------------- COLUMN MAP ---------------- */
  const columnMap = {
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],

    quantity: ["sd.obs_increase_qty"],
    obs_authorised: ["sd.obs_authorised"],
    quote_authority: ["sd.quote_authority"],

    internal_demand_no: ["sd.internal_demand_no"],
    internal_demand_date: ["sd.internal_demand_date"],

    requisition_no: ["sd.requisition_no"],
    requisition_date: ["sd.requisition_date"],

    modemand: ["sd.mo_demand_no"],
    modate: ["sd.mo_demand_date"],

    created_at: ["sd.created_at"],
    created_by_name: ["sd.created_by_name"],
  };

  /* ---------------- SEARCH WHERE ---------------- */
  let searchParams = [];

  /* ---------------- SEARCH WHERE ---------------- */
  if (search) {
    let searchConditions = [];

    const validCols = rawCols.map((c) => c.trim()).filter((c) => columnMap[c]);

    // Split by comma OR space
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
            // Numeric fields
            if (["quantity"].includes(col) && !isNaN(word)) {
              searchParams.push(Number(word));
              wordFragments.push(`${dbCol} = ?`);
            }

            // Date fields
            else if (
              ["internal_demand_date", "requisition_date", "modate"].includes(
                col,
              )
            ) {
              searchParams.push(word);
              wordFragments.push(`DATE(${dbCol}) = ?`);
            }

            // Default LIKE
            else {
              searchParams.push(`%${word}%`);
              wordFragments.push(`${dbCol} LIKE ?`);
            }
          }
        }
      } else {
        // Default global search
        searchParams.push(
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
          `%${word}%`,
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
          OR s.indian_pattern LIKE ?
          OR t.indian_pattern LIKE ?
          OR s.category LIKE ?
          OR t.category LIKE ?
          OR sd.internal_demand_no LIKE ?
          OR sd.requisition_no LIKE ?
          OR sd.mo_demand_no LIKE ?
          OR sd.created_by_name LIKE ?
        )
      `);
      }

      // Each word must match somewhere
      searchConditions.push(`(${wordFragments.join(" OR ")})`);
    }

    // Combine words with AND
    whereClause += ` AND (${searchConditions.join(" AND ")})`;
  }
  try {
    /* ---------- TOTAL COUNT ---------- */
    const [totalCount] = await pool.query(
      `
      SELECT COUNT(sd.id) AS count
      FROM special_demand sd
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

    /* ---------- MAIN QUERY ---------- */
    const query = `
      SELECT
        sd.id,
        sd.spare_id,
        sd.tool_id,

        sd.obs_authorised,
        sd.obs_increase_qty,

        sd.internal_demand_no,
        sd.internal_demand_date,
        sd.requisition_no,
        sd.requisition_date,
        sd.mo_demand_no,
        sd.mo_demand_date,
        sd.quote_authority,

        sd.created_by,
        sd.created_by_name,
        sd.created_at,

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
        END AS category

      FROM special_demand sd
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
        "Completed special demand records retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET COMPLETED SPECIAL DEMAND ERROR =>", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch completed special demand list",
    });
  }
}

async function createD787Original(req, res) {
  const { id: userId, name } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      obs_authorised,
      obs_increase_qty,
      obs_maintained,
      obs_held,
      maintained_qty,
      qty_held,
      box_no,
    } = req.body;

    console.log("REQ.BODY =>", req.body);

    /* =====================================================
       INSERT ONLY INTO d787_special_demand;
       ===================================================== */

    const specialDemandQuery = `
      INSERT INTO d787_special_demand (
        spare_id,
        tool_id,
        obs_authorised,
        obs_increase_qty,
        obs_maintained,
        obs_held,
        maintained_qty,
        qty_held,
        created_by,
        created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(specialDemandQuery, [
      spare_id || null,
      tool_id || null,
      obs_authorised || 0,
      obs_increase_qty || 0,
      obs_maintained || 0,
      obs_held || 0,
      maintained_qty || 0,
      qty_held || 0,
      userId,
      name,
    ]);

    /* =====================================================
       Update spares / tools master table
       ===================================================== */

    await pool.query(
      `UPDATE ${spare_id ? "spares" : "tools"} 
       SET 
         box_no = ?, 
         obs_authorised = ?, 
         obs_maintained = ?, 
         obs_held = ?
       WHERE id = ?`,
      [
        typeof box_no === "string" ? box_no : JSON.stringify(box_no),
        obs_authorised || 0,
        obs_maintained || 0,
        obs_held || 0,
        spare_id || tool_id,
      ],
    );

    res.json({
      success: true,
      message: "Inserted successfully into d787 Special Demand",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getD787List(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query?.search ? req.query.search.trim() : "";
  const rawCols = req.query?.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    /* ===== ITEM INFO ===== */
    description: ["s.description", "t.description"],
    indian_pattern: ["s.indian_pattern", "t.indian_pattern"],
    category: ["s.category", "t.category"],
    equipment_system: ["s.equipment_system", "t.equipment_system"],
    denos: ["s.denos", "t.denos"],

    /* ===== DEMAND NUMBERS ===== */
    internal_demand_no: ["sd.internal_demand_no"],
    requisition_no: ["sd.requisition_no"],
    mo_demand_no: ["sd.mo_demand_no"],
    created_by_name: ["sd.created_by_name"],

    /* ===== QUANTITIES ===== */
    obs_authorised: ["sd.obs_authorised"],
    obs_increase_qty: ["sd.obs_increase_qty"],
    obs_maintained: ["sd.obs_maintained"],
    obs_held: ["sd.obs_held"],
    maintained_qty: ["sd.maintained_qty"],
    qty_held: ["sd.qty_held"],

    /* ===== DATE ===== */
    created_at: ["s.created_at"],
  };

  const connection = await pool.getConnection();

  try {
    /* ---------------- BASE WHERE ---------------- */
    let whereConditions = [
      `(sd.internal_demand_no IS NULL 
        OR sd.requisition_no IS NULL 
        OR sd.mo_demand_no IS NULL)`,
    ];

    let queryParams = [];

    /* ---------------- SEARCH ---------------- */
    /* ---------------- SEARCH ---------------- */
    if (search) {
      let searchConditions = [];

      const validCols = rawCols
        .map((c) => c.trim())
        .filter((col) => columnMap[col]);

      // Split by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((word) => word.trim())
        .filter(Boolean);

      for (const word of searchWords) {
        let wordFragments = [];

        if (validCols.length > 0) {
          for (const colName of validCols) {
            const dbColumns = columnMap[colName];

            for (const dbCol of dbColumns) {
              /* ---- Numeric exact match ---- */
              if (
                [
                  "obs_authorised",
                  "obs_increase_qty",
                  "obs_maintained",
                  "obs_held",
                  "maintained_qty",
                  "qty_held",
                ].includes(colName) &&
                !isNaN(word)
              ) {
                queryParams.push(Number(word));
                wordFragments.push(`${dbCol} = ?`);
              } else if (colName === "created_at") {
                /* ---- Date exact match ---- */
                queryParams.push(word);
                wordFragments.push(`DATE(${dbCol}) = ?`);
              } else {
                /* ---- Default LIKE ---- */
                queryParams.push(`%${word}%`);
                wordFragments.push(`${dbCol} LIKE ?`);
              }
            }
          }
        } else {
          /* ---- Global fallback ---- */
          queryParams.push(
            `%${word}%`,
            `%${word}%`,
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
          OR s.indian_pattern LIKE ?
          OR t.indian_pattern LIKE ?
          OR sd.internal_demand_no LIKE ?
          OR sd.requisition_no LIKE ?
          OR sd.mo_demand_no LIKE ?
          OR sd.created_by_name LIKE ?
        )
      `);
        }

        // Each word must match somewhere
        searchConditions.push(`(${wordFragments.join(" OR ")})`);
      }

      // Combine words using AND
      whereConditions.push(`(${searchConditions.join(" AND ")})`);
    }

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    /* ---------------- COUNT ---------------- */
    const [totalCount] = await connection.query(
      `
      SELECT COUNT(sd.id) as count
      FROM d787_special_demand sd
      LEFT JOIN spares s ON s.id = sd.spare_id
      LEFT JOIN tools t ON t.id = sd.tool_id
      ${finalWhereClause}
      `,
      queryParams,
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
          "No special demand found",
        ),
      );
    }

    /* ---------------- MAIN QUERY ---------------- */
    const [rows] = await connection.query(
      `
      SELECT
        sd.*,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN 'spares'
          WHEN sd.tool_id IS NOT NULL THEN 'tools'
          ELSE 'unknown'
        END AS source,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.description
          WHEN sd.tool_id IS NOT NULL THEN t.description
        END AS description,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.indian_pattern
          WHEN sd.tool_id IS NOT NULL THEN t.indian_pattern
        END AS indian_pattern,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.category
          WHEN sd.tool_id IS NOT NULL THEN t.category
        END AS category,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.equipment_system
          WHEN sd.tool_id IS NOT NULL THEN t.equipment_system
        END AS equipment_system,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.denos
          WHEN sd.tool_id IS NOT NULL THEN t.denos
        END AS denos

      FROM d787_special_demand sd
      LEFT JOIN spares s ON s.id = sd.spare_id
      LEFT JOIN tools t ON t.id = sd.tool_id
      ${finalWhereClause}
      ORDER BY sd.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    res.json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "Special demand list retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET SPECIAL DEMAND ERROR =>", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch special demand list",
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  createSpecialDemand,
  getSpecialDemandList,
  updateSpecialDemand,
  getLogsSpecialDemand,
  createD787Original,
  getD787List,
};
