const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function getProcurementPending(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    // Item Info
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],

    // Demand (from pending_issue)
    demand_no: ["pi.demand_no" || "pi.mo_no"],
    demand_quantity: ["pi.demand_quantity"],

    // NAC / Procurement (from procurement table p)
    nac_qty: ["p.nac_qty"],
    nac_no: ["p.nac_no"],
    nac_date: ["p.nac_date"],
    validity: ["p.validity"],
    rate_unit: ["p.rate_unit"],
    created_at: ["p.created_at"],
    qty_received: ["p.qty_received"],
  };

  const connection = await pool.getConnection();

  try {
    /* ================= WHERE ================= */
    let whereConditions = [`(p.status = 'pending' OR p.status = 'partial')`];
    let queryParams = [];

    /* ================= SEARCH ================= */
    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((c) => columnMap[c.trim()]);

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col.trim()];
          const sub = dbCols
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${sub})`);
        }
      } else {
        searchFragments.push(
          `(sp.description LIKE ? OR t.description LIKE ? OR p.nac_no LIKE ?)`,
        );
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      whereConditions.push(`(${searchFragments.join(" OR ")})`);
    }

    const finalWhere =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    /* ================= COUNT ================= */
    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM procurement p
      LEFT JOIN spares sp ON p.spare_id = sp.id
      LEFT JOIN tools t ON p.tool_id = t.id
      ${finalWhere}
      `,
      queryParams,
    );

    const totalItems = countRows[0].count;

    if (totalItems === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No pending procurement found",
      ).send(res);
    }

    /* ================= DATA ================= */
    const [rows] = await connection.query(
      `
      SELECT
        p.*,
        COALESCE(sp.description, t.description) AS description,
        COALESCE(sp.category, t.category) AS category,
        COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
        COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,
        COALESCE(sp.supplier, t.supplier) AS supplier,
        COALESCE(sp.oem, t.oem) AS oem,
        COALESCE(sp.box_no, t.box_no, p.box_no) AS box_no,

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

      ${finalWhere}

      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
      "Procurement pending list fetched successfully",
    ).send(res);
  } catch (error) {
    console.log("Procurement pending error:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

// async function getStockUpdatePending(req, res) {
//   const page = parseInt(req.query?.page) || 1;
//   const limit = parseInt(req.query?.limit) || 10;
//   const offset = (page - 1) * limit;
//   const search = req.query.search ? req.query.search.trim() : "";
//   const rawCols = req.query.cols ? req.query.cols.split(",") : [];

//   const columnMap = {
//     description: ["sp.description", "t.description"],
//     category: ["sp.category", "t.category"],
//     indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
//     mo_no: ["s.mo_no"],
//     // demand_no: ["pi.demand_no"],
//     demand_quantity: ["pi.demand_quantity"],
//     qty_received: ["s.qty_received"],
//     stocked_in_qty: ["s.stocked_in_qty"],
//   };

//   const connection = await pool.getConnection();

//   try {
//     /* ================= WHERE ================= */
//     let whereConditions = [`(s.status = 'pending' OR s.status = 'partial')`];
//     let queryParams = [];

//     /* ================= SEARCH ================= */
//     if (search) {
//       let searchFragments = [];
//       const validCols = rawCols.filter((c) => columnMap[c.trim()]);

//       if (validCols.length > 0) {
//         for (const col of validCols) {
//           const dbCols = columnMap[col.trim()];
//           const sub = dbCols
//             .map((dbCol) => {
//               queryParams.push(`%${search}%`);
//               return `${dbCol} LIKE ?`;
//             })
//             .join(" OR ");
//           searchFragments.push(`(${sub})`);
//         }
//       } else {
//         searchFragments.push(
//           `(sp.description LIKE ? OR t.description LIKE ? OR s.mo_no LIKE ?)`,
//         );
//         queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
//       }

//       whereConditions.push(`(${searchFragments.join(" OR ")})`);
//     }

//     const finalWhere =
//       whereConditions.length > 0
//         ? "WHERE " + whereConditions.join(" AND ")
//         : "";

//     /* ================= COUNT ================= */
//     const [countRows] = await connection.query(
//       `
//       SELECT COUNT(*) AS count
//       FROM stock_update s
//       LEFT JOIN spares sp ON s.spare_id = sp.id
//       LEFT JOIN tools t ON s.tool_id = t.id
//       ${finalWhere}
//       `,
//       queryParams,
//     );

//     const totalItems = countRows[0].count;

//     if (totalItems === 0) {
//       return new ApiResponse(
//         200,
//         { items: [], totalItems: 0, totalPages: 1, currentPage: page },
//         "No pending stock update found",
//       ).send(res);
//     }

//     /* ================= DATA ================= */
//     const [rows] = await connection.query(
//       `
//       SELECT
//         s.*,
//         COALESCE(sp.description, t.description) AS description,
//         COALESCE(sp.category, t.category) AS category,
//         COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
//         COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,
//         COALESCE(sp.box_no, t.box_no, s.box_no) AS box_no,

//         'STOCK_UPDATE' AS source,
//            CASE
//            WHEN pi.mo_no IS NOT NULL AND pi.mo_no != ''
//            THEN pi.mo_no
//            ELSE pi.demand_no
//           END AS demand_no,

//          CASE
//          WHEN pi.mo_date IS NOT NULL
//          THEN pi.mo_date
//          ELSE pi.demand_date
//         END AS demand_date,

//         pi.demand_quantity

//       FROM stock_update s
//       LEFT JOIN spares sp ON s.spare_id = sp.id
//       LEFT JOIN tools t ON s.tool_id = t.id
//       LEFT JOIN pending_issue pi ON s.issued_id = pi.id

//       ${finalWhere}

//       ORDER BY s.id DESC
//       LIMIT ? OFFSET ?
//       `,
//       [...queryParams, limit, offset],
//     );

//     return new ApiResponse(
//       200,
//       {
//         items: rows,
//         totalItems,
//         totalPages: Math.ceil(totalItems / limit),
//         currentPage: page,
//       },
//       "Stock update pending list fetched successfully",
//     ).send(res);
//   } catch (error) {
//     console.log("Stock update pending error:", error);
//     return new ApiErrorResponse(500, {}, "Internal server error").send(res);
//   } finally {
//     connection.release();
//   }
// }

async function getStockUpdatePending(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    mo_no: ["s.mo_no"],
    mo_date: ["s.mo_date"],
    // demand_no: ["pi.demand_no"],
    demand_quantity: ["pi.demand_quantity"],
    qty_received: ["s.qty_received"],
    stocked_in_qty: ["s.stocked_in_qty"],
    created_at: ["s.created_at"],
  };
  const connection = await pool.getConnection();

  try {
    /* ================= WHERE ================= */
    let whereConditions = [`(s.status = 'pending' OR s.status = 'partial')`];
    let queryParams = [];

    /* ================= SEARCH ================= */
    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((c) => columnMap[c.trim()]);

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col.trim()];
          const sub = dbCols
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${sub})`);
        }
      } else {
        // default fallback search
        searchFragments.push(`
          (
            sp.description LIKE ?
            OR t.description LIKE ?
            OR pi.mo_no LIKE ?
            OR pi.demand_no LIKE ?
          )
        `);

        queryParams.push(
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
        );
      }

      whereConditions.push(`(${searchFragments.join(" OR ")})`);
    }

    const finalWhere =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    /* ================= COUNT ================= */
    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM stock_update s
      LEFT JOIN spares sp ON s.spare_id = sp.id
      LEFT JOIN tools t ON s.tool_id = t.id
      LEFT JOIN pending_issue pi ON s.issued_id = pi.id
      ${finalWhere}
      `,
      queryParams,
    );

    const totalItems = countRows[0].count;

    if (totalItems === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No pending stock update found",
      ).send(res);
    }

    /* ================= DATA ================= */
    const [rows] = await connection.query(
      `
      SELECT
        s.*,
        COALESCE(sp.description, t.description) AS description,
        COALESCE(sp.category, t.category) AS category,
        COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
        COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,
        COALESCE(sp.box_no, t.box_no, s.box_no) AS box_no,

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
      ${finalWhere}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
      "Stock update pending list fetched successfully",
    ).send(res);
  } catch (error) {
    console.log("Stock update pending error:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function updateStock(req, res) {
  const { id: userId } = req.user;
  const { id, qty_received, return_date, box_no, approve = true } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /* =====================================================
       1️⃣ FETCH STOCK ROW
    ===================================================== */
    const [[row]] = await connection.query(
      `SELECT * FROM stock_update WHERE id = ?`,
      [id],
    );

    if (!row) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }

    const issuedQty = Number(row.stocked_in_qty || 0);
    const alreadyReceived = Number(row.qty_received || 0);
    const receiveNow = Number(qty_received || 0);

    /* =====================================================
       2️⃣ VALIDATION
    ===================================================== */
    if (receiveNow <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid return qty",
      });
    }

    if (alreadyReceived + receiveNow > issuedQty) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Return qty exceeds issued qty",
      });
    }

    /* =====================================================
       3️⃣ STATUS CALCULATION (LIKE updatePendingIssue)
    ===================================================== */

    const newReceived = alreadyReceived + receiveNow;

    let status = "pending";

    if (newReceived === issuedQty) {
      status = "complete";
    } else if (newReceived > 0 && newReceived < issuedQty) {
      status = "partial";
    } else {
      status = "pending";
    }

    /* =====================================================
       4️⃣ IDENTIFY INVENTORY
    ===================================================== */
    const isSpare = !!row.spare_id;
    const inventoryTable = isSpare ? "spares" : "tools";
    const inventoryId = row.spare_id || row.tool_id;

    const [[inventory]] = await connection.query(
      `SELECT box_no, obs_held FROM ${inventoryTable} WHERE id = ?`,
      [inventoryId],
    );

    let boxes = JSON.parse(inventory.box_no || "[]");
    const previousOBS = Number(inventory.obs_held || 0);

    let totalDepositedQty = 0;
    const boxTransactions = [];
    const now = new Date();

    /* =====================================================
       5️⃣ BOX DEPOSIT UPDATE
    ===================================================== */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no?.find((b) => b.no === box.no);
      if (!match) return box;

      const prevQty = Number(box.qtyHeld || 0);
      const depositQty = Number(match.deposit || 0);

      totalDepositedQty += depositQty;

      boxTransactions.push([
        row.id,
        null,
        isSpare ? row.spare_id : null,
        !isSpare ? row.tool_id : null,
        box.no,
        prevQty,
        depositQty,
        now,
      ]);

      return {
        ...box,
        qtyHeld: prevQty + depositQty,
      };
    });

    const newOBS = previousOBS + totalDepositedQty;

    /* =====================================================
       6️⃣ UPDATE INVENTORY
    ===================================================== */
    await connection.query(
      `UPDATE ${inventoryTable}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, inventoryId],
    );

    /* =====================================================
       7️⃣ UPDATE STOCK_UPDATE ROW
    ===================================================== */
    await connection.query(
      `
      UPDATE stock_update
      SET
        qty_received = ?,
        return_date = ?,
        status = ?,
        approved_by = ?,
        approved_at = NOW(),
        box_no = ?
      WHERE id = ?
      `,
      [
        newReceived,
        return_date,
        status,
        approve ? userId : null,
        JSON.stringify(updatedBoxes),
        id,
      ],
    );

    /* =====================================================
       8️⃣ BOX TRANSACTIONS
    ===================================================== */
    if (boxTransactions.length) {
      await connection.query(
        `
        INSERT INTO box_transaction (
          transaction_id, demand_transaction,
          spare_id, tool_id,
          box_no, prev_qty,
          withdrawl_qty, transaction_date
        ) VALUES ?
        `,
        [boxTransactions],
      );
    }

    /* =====================================================
       9️⃣ OBS AUDIT
    ===================================================== */
    await connection.query(
      `
      INSERT INTO obs_audit (
        transaction_id, previous_obs, new_obs
      ) VALUES (?, ?, ?)
      `,
      [row.id, previousOBS, newOBS],
    );

    await connection.commit();

    res.json({
      success: true,
      status,
      newReceived,
      message: `Stock return processed (${status})`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("UPDATE STOCK ERROR =>", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    connection.release();
  }
}

async function updateProcurement(req, res) {
  const { id: userId } = req.user;
  const {
    id,
    qty_received,
    return_date,
    box_no,
    approve = true,
    supplier,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /* =====================================================
       1️⃣ FETCH STOCK ROW
    ===================================================== */
    const [[row2]] = await connection.query(
      `SELECT
        p.*,
        COALESCE(s.supplier, t.supplier) AS supplier,
        COALESCE(s.old_supplier, t.old_supplier) AS old_supplier
      FROM procurement p
      LEFT JOIN spares s ON p.spare_id = s.id
      LEFT JOIN tools t ON p.tool_id = t.id
      WHERE p.id = ?`,
      [id],
    );

    if (!row2) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }

    if (row2.supplier != supplier) {
      let old_supplier = row2.old_supplier || [];
      if (!old_supplier.includes(supplier)) {
        old_supplier.push(row2.supplier);

        await connection.query(
          `UPDATE ${row2.spare_id ? "spares" : "tools"} SET supplier = ?, old_supplier=? WHERE id = ?`,
          [
            supplier,
            JSON.stringify(old_supplier),
            row2.spare_id || row2.tool_id,
          ],
        );
      }
    }

    const issuedQty = Number(row2.nac_qty || 0);
    const alreadyReceived = Number(row2.qty_received || 0);
    const receiveNow = Number(qty_received || 0);

    /* =====================================================
       2️⃣ VALIDATION
    ===================================================== */
    if (receiveNow <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid return qty",
      });
    }

    if (alreadyReceived + receiveNow > issuedQty) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Return qty exceeds issued qty",
      });
    }

    /* =====================================================
       3️⃣ STATUS CALCULATION (LIKE updatePendingIssue)
    ===================================================== */

    const newReceived = alreadyReceived + receiveNow;

    let status = "pending";

    if (newReceived === issuedQty) {
      status = "complete";
    } else if (newReceived > 0 && newReceived < issuedQty) {
      status = "partial";
    } else {
      status = "pending";
    }

    /* =====================================================
       4️⃣ IDENTIFY INVENTORY
    ===================================================== */
    const isSpare = !!row2.spare_id;
    const inventoryTable = isSpare ? "spares" : "tools";
    const inventoryId = row2.spare_id || row2.tool_id;

    const [invRows] = await connection.query(
      `SELECT box_no, obs_held FROM ${inventoryTable} WHERE id = ?`,
      [inventoryId],
    );

    if (!invRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `${inventoryTable} stock not found`,
      });
    }

    const inventory = invRows[0];

    let boxes = JSON.parse(inventory.box_no || "[]");
    const previousOBS = Number(inventory.obs_held || 0);

    let totalDepositedQty = 0;
    const boxTransactions = [];
    const now = new Date();

    /* =====================================================
       5️⃣ BOX DEPOSIT UPDATE
    ===================================================== */
    const updatedBoxes = boxes.map((box) => {
      const match = box_no?.find((b) => b.no === box.no);
      if (!match) return box;

      const prevQty = Number(box.qtyHeld || 0);
      const depositQty = Number(match.deposit || 0);

      totalDepositedQty += depositQty;

      boxTransactions.push([
        row2.id,
        null,
        isSpare ? row2.spare_id : null,
        !isSpare ? row2.tool_id : null,
        box.no,
        prevQty,
        depositQty,
        now,
      ]);

      return {
        ...box,
        qtyHeld: prevQty + depositQty,
      };
    });

    const newOBS = previousOBS + totalDepositedQty;

    /* =====================================================
       6️⃣ UPDATE INVENTORY
    ===================================================== */
    await connection.query(
      `UPDATE ${inventoryTable}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, inventoryId],
    );

    /* =====================================================
       7️⃣ UPDATE STOCK_UPDATE ROW
    ===================================================== */
    await connection.query(
      `
      UPDATE procurement
      SET
        qty_received = ?,
        return_date = ?,
        status = ?,
        approved_by = ?,
        approved_at = NOW(),
        box_no = ?
      WHERE id = ?
      `,
      [
        newReceived,
        return_date,
        status,
        approve ? userId : null,
        JSON.stringify(updatedBoxes),
        id,
      ],
    );

    /* =====================================================
       8️⃣ BOX TRANSACTIONS
    ===================================================== */
    if (boxTransactions.length) {
      await connection.query(
        `
        INSERT INTO box_transaction (
          transaction_id, demand_transaction,
          spare_id, tool_id,
          box_no, prev_qty,
          withdrawl_qty, transaction_date
        ) VALUES ?
        `,
        [boxTransactions],
      );
    }

    /* =====================================================
       9️⃣ OBS AUDIT
    ===================================================== */
    await connection.query(
      `
      INSERT INTO obs_audit (
        transaction_id, previous_obs, new_obs
      ) VALUES (?, ?, ?)
      `,
      [row2.id, previousOBS, newOBS],
    );

    await connection.commit();

    res.json({
      success: true,
      status,
      newReceived,
      message: `Procurement return processed (${status})`,
    });
  } catch (error) {
    await connection.rollback();
    console.log("UPDATE Procurement ERROR =>", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    connection.release();
  }
}

async function getLogsProcurement(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    // Item Info
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],

    // Demand (from pending_issue)
    demand_no: ["pi.demand_no" || "pi.mo_no"],
    demand_quantity: ["pi.demand_quantity"],

    // NAC / Procurement (from procurement table p)
    nac_qty: ["p.nac_qty"],
    nac_no: ["p.nac_no"],
    nac_date: ["p.nac_date"],
    validity: ["p.validity"],
    rate_unit: ["p.rate_unit"],
    created_at: ["p.created_at"],
    qty_received: ["p.qty_received"],
  };

  const connection = await pool.getConnection();

  try {
    let whereConditions = [`p.status = 'complete'`];
    let queryParams = [];

    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((c) => columnMap[c.trim()]);

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col.trim()];
          const sub = dbCols
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${sub})`);
        }
      } else {
        searchFragments.push(
          `(sp.description LIKE ? OR t.description LIKE ? OR p.nac_no LIKE ?)`,
        );
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      whereConditions.push(`(${searchFragments.join(" OR ")})`);
    }

    const finalWhere =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM procurement p
      LEFT JOIN spares sp ON p.spare_id = sp.id
      LEFT JOIN tools t ON p.tool_id = t.id
      ${finalWhere}
      `,
      queryParams,
    );

    const totalItems = countRows[0].count;

    if (totalItems === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No pending procurement found",
      ).send(res);
    }

    const [rows] = await connection.query(
      `
      SELECT
        p.*,
        COALESCE(sp.description, t.description) AS description,
        COALESCE(sp.category, t.category) AS category,
        COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
        COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,
        COALESCE(sp.box_no, t.box_no, p.box_no) AS box_no,

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

      ${finalWhere}

      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
      "Procurement logs fetched successfully",
    ).send(res);
  } catch (error) {
    console.log("Procurement pending error:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getLogsStockUpdate(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    mo_no: ["s.mo_no"],
    mo_date: ["s.mo_date"],
    // demand_no: ["pi.demand_no"],
    demand_quantity: ["pi.demand_quantity"],
    qty_received: ["s.qty_received"],
    stocked_in_qty: ["s.stocked_in_qty"],
    created_at: ["s.created_at"],
  };

  const connection = await pool.getConnection();

  try {
    let whereConditions = [`s.status = 'complete'`];
    let queryParams = [];

    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((c) => columnMap[c.trim()]);

      if (validCols.length > 0) {
        for (const col of validCols) {
          const dbCols = columnMap[col.trim()];
          const sub = dbCols
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${sub})`);
        }
      } else {
        searchFragments.push(
          `(sp.description LIKE ? OR t.description LIKE ? OR s.mo_no LIKE ?)`,
        );
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      whereConditions.push(`(${searchFragments.join(" OR ")})`);
    }

    const finalWhere =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM stock_update s
      LEFT JOIN spares sp ON s.spare_id = sp.id
      LEFT JOIN tools t ON s.tool_id = t.id
      ${finalWhere}
      `,
      queryParams,
    );

    const totalItems = countRows[0].count;

    if (totalItems === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No pending stock update found",
      ).send(res);
    }

    const [rows] = await connection.query(
      `
      SELECT
        s.*,
        COALESCE(sp.description, t.description) AS description,
        COALESCE(sp.category, t.category) AS category,
        COALESCE(sp.equipment_system, t.equipment_system) AS equipment_system,
        COALESCE(sp.indian_pattern, t.indian_pattern) AS indian_pattern,
        COALESCE(sp.box_no, t.box_no, s.box_no) AS box_no,

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

      ${finalWhere}

      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
      `,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
      "Stock update logs fetched successfully",
    ).send(res);
  } catch (error) {
    console.log("Stock update pending error:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

module.exports = {
  getProcurementPending,
  getStockUpdatePending,
  updateStock,
  updateProcurement,
  getLogsProcurement,
  getLogsStockUpdate,
};
