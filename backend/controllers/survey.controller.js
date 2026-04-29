const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function createSurvey(req, res) {
  const {
    spare_id,
    tool_id,
    withdrawl_qty,
    withdrawl_date,
    box_no,
    service_no,
    name,
    issue_to,
    remarks_survey,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const { id: created_by } = req.user;

    if (!spare_id && !tool_id) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide either spare_id or tool_id",
      ).send(res);
    }

    if (
      !withdrawl_qty ||
      !withdrawl_date ||
      !service_no ||
      !name ||
      !issue_to
    ) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide all required fields",
      ).send(res);
    }

    if (!box_no || !Array.isArray(box_no)) {
      return new ApiErrorResponse(400, {}, "box_no is required").send(res);
    }

    const transactionId = "PI-" + Date.now();
    const tableName = spare_id ? "spares" : "tools";
    const itemId = spare_id || tool_id;

    const [[row]] = await connection.query(
      `SELECT category, box_no, obs_held
       FROM ${tableName}
       WHERE id = ? FOR UPDATE`,
      [itemId],
    );

    if (!row) {
      return new ApiErrorResponse(404, {}, "Item not found").send(res);
    }

    const category = row.category?.toLowerCase();

    if (Number(row.obs_held) - Number(withdrawl_qty) < 0) {
      return new ApiErrorResponse(400, {}, "Invalid withdrawl quantity").send(
        res,
      );
    }

    const itemBoxNo = JSON.parse(row.box_no || "[]");

    /* ===============================
       UPDATE BOX QUANTITIES
    =============================== */
    const updatedBoxes = itemBoxNo.map((box) => {
      const match = box_no.find((b) => b.no == box.no);
      if (!match) return box;

      return {
        ...box,
        qtyHeld: (
          Number(box.qtyHeld || 0) - Number(match.withdraw || 0)
        ).toString(),
      };
    });

    const newOBS = Number(row.obs_held) - Number(withdrawl_qty);

    /* =====================================================
       CATEGORY C / LP → INSERT INTO DEMAND ONLY
    ===================================================== */
    if (category === "c" || category === "lp") {
      await connection.query(
        `INSERT INTO demand (
          spare_id, tool_id, issue_to, transaction_id,
          survey_qty, survey_voucher_no, survey_date,
          created_at, created_by, status, remarks_survey
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          spare_id || null,
          tool_id || null,
          issue_to,
          transactionId,
          withdrawl_qty,
          null,
          withdrawl_date,
          getSQLTimestamp(),
          created_by,
          "pending",
          remarks_survey || null,
        ],
      );
    } else {
      /* =====================================================
         OTHER CATEGORY → INSERT INTO SURVEY ONLY
      ===================================================== */
      await connection.query(
        `INSERT INTO survey (
          spare_id, tool_id, withdrawl_qty, withdrawl_date,
          box_no, service_no, name, issue_to,
          created_by, transaction_id, created_at, remarks_survey
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          spare_id || null,
          tool_id || null,
          withdrawl_qty,
          withdrawl_date,
          JSON.stringify(updatedBoxes),
          service_no,
          name,
          issue_to,
          created_by,
          transactionId,
          getSQLTimestamp(),
          remarks_survey || null,
        ],
      );
    }

    /* =====================================================
       UPDATE INVENTORY (BOTH CASES)
    ===================================================== */
    await connection.query(
      `UPDATE ${tableName}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(updatedBoxes), newOBS, itemId],
    );

    /* =====================================================
       INSERT BOX TRANSACTION (BOTH CASES)
    ===================================================== */
    const boxTransactions = [];
    const now = new Date();

    box_no.forEach((box) => {
      const originalBox = itemBoxNo.find((b) => b.no === box.no);
      if (!originalBox) return;

      boxTransactions.push([
        transactionId,
        null,
        spare_id || null,
        tool_id || null,
        box.no,
        Number(originalBox.qtyHeld || 0),
        -Number(box.withdraw || 0),
        now,
      ]);
    });

    if (boxTransactions.length) {
      await connection.query(
        `INSERT INTO box_transaction (
          transaction_id,
          demand_transaction,
          spare_id,
          tool_id,
          box_no,
          prev_qty,
          withdrawl_qty,
          transaction_date
        ) VALUES ?`,
        [boxTransactions],
      );
    }

    /* =====================================================
       INSERT OBS AUDIT (BOTH CASES)
    ===================================================== */
    await connection.query(
      `INSERT INTO obs_audit (
        transaction_id,
        previous_obs,
        new_obs
      ) VALUES (?, ?, ?)`,
      [transactionId, Number(row.obs_held), newOBS],
    );

    await connection.commit();

    return new ApiResponse(201, {}, "Transaction created successfully").send(
      res,
    );
  } catch (error) {
    await connection.rollback();
    console.log("Error while creating transaction:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

// async function createSurvey(req, res) {
//   const {
//     spare_id,
//     tool_id,
//     withdrawl_qty,
//     withdrawl_date,
//     box_no,
//     service_no,
//     name,
//     issue_to,
//   } = req.body;

//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();
//     const { id: created_by } = req.user;

//     if (!spare_id && !tool_id) {
//       return new ApiErrorResponse(
//         400,
//         {},
//         "Please provide either spare_id or tool_id",
//       ).send(res);
//     }

//     if (
//       !withdrawl_qty ||
//       !withdrawl_date ||
//       !service_no ||
//       !name ||
//       !issue_to
//     ) {
//       return new ApiErrorResponse(
//         400,
//         {},
//         "Please provide all required fields",
//       ).send(res);
//     }

//     const transactionId = "PI-" + Date.now();

//     const [[row]] = await connection.query(
//       `SELECT category, box_no, obs_held
//        FROM ${spare_id ? "spares" : "tools"}
//        WHERE id = ?`,
//       [spare_id || tool_id],
//     );

//     if (!row) {
//       return new ApiErrorResponse(404, {}, "Item not found").send(res);
//     }

//     /* =========================================================
//        CATEGORY C / LP → ONLY DEMAND (NO STOCK MOVEMENT)
//     ========================================================== */
//     if (
//       row.category?.toLowerCase() === "c" ||
//       row.category?.toLowerCase() === "lp"
//     ) {
//       await connection.query(
//         `INSERT INTO demand (
//           spare_id, tool_id, issue_to, transaction_id,
//           survey_qty, survey_voucher_no, survey_date,
//           created_at, created_by, status
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           spare_id || null,
//           tool_id || null,
//           issue_to,
//           transactionId,
//           withdrawl_qty,
//           service_no,
//           withdrawl_date,
//           getSQLTimestamp(),
//           created_by,
//           "pending",
//         ],
//       );
//     } else {
//       /* =========================================================
//        NORMAL CATEGORY → STOCK WITHDRAW
//     ========================================================== */
//       if (!box_no || !Array.isArray(box_no)) {
//         return new ApiErrorResponse(400, {}, "box_no is required").send(res);
//       }

//       const itemBoxNo = JSON.parse(row.box_no || "[]");

//       if (Number(row.obs_held) - Number(withdrawl_qty) < 0) {
//         return new ApiErrorResponse(400, {}, "Invalid withdrawl quantity").send(
//           res,
//         );
//       }

//       const updatedBoxes = itemBoxNo.map((box) => {
//         const match = box_no.find((b) => b.no == box.no);
//         if (!match) return box;

//         return {
//           ...box,
//           qtyHeld: (
//             Number(box.qtyHeld || 0) - Number(match.withdraw || 0)
//           ).toString(),
//         };
//       });

//       /* ---------- INSERT SURVEY ---------- */
//       await connection.query(
//         `INSERT INTO survey (
//           spare_id, tool_id, withdrawl_qty, withdrawl_date,
//           box_no, service_no, name, issue_to,
//           created_by, transaction_id, created_at
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           spare_id || null,
//           tool_id || null,
//           withdrawl_qty,
//           withdrawl_date,
//           JSON.stringify(updatedBoxes),
//           service_no,
//           name,
//           issue_to,
//           created_by,
//           transactionId,
//           getSQLTimestamp(),
//         ],
//       );

//       /* ---------- UPDATE INVENTORY ---------- */
//       await connection.query(
//         `UPDATE ${spare_id ? "spares" : "tools"}
//          SET box_no = ?, obs_held = ?
//          WHERE id = ?`,
//         [
//           JSON.stringify(updatedBoxes),
//           Number(row.obs_held) - Number(withdrawl_qty),
//           spare_id || tool_id,
//         ],
//       );

//       /* ---------- BOX TRANSACTION ---------- */
//       const boxTransactions = [];
//       const now = new Date();

//       box_no.forEach((box) => {
//         const originalBox = itemBoxNo.find((b) => b.no === box.no);
//         if (!originalBox) return;

//         boxTransactions.push([
//           transactionId,
//           null,
//           spare_id || null,
//           tool_id || null,
//           box.no,
//           Number(originalBox.qtyHeld || 0),
//           -Number(box.withdraw || 0),
//           now,
//         ]);
//       });

//       if (boxTransactions.length) {
//         await connection.query(
//           `
//           INSERT INTO box_transaction (
//             transaction_id,
//             demand_transaction,
//             spare_id,
//             tool_id,
//             box_no,
//             prev_qty,
//             withdrawl_qty,
//             transaction_date
//           ) VALUES ?
//           `,
//           [boxTransactions],
//         );
//       }

//       /* ---------- OBS AUDIT ---------- */
//       await connection.query(
//         `
//         INSERT INTO obs_audit (
//           transaction_id,
//           previous_obs,
//           new_obs
//         ) VALUES (?, ?, ?)
//         `,
//         [
//           transactionId,
//           Number(row.obs_held),
//           Number(row.obs_held) - Number(withdrawl_qty),
//         ],
//       );
//     }

//     await connection.commit();

//     return new ApiResponse(201, {}, "Survey created successfully").send(res);
//   } catch (error) {
//     await connection.rollback();
//     console.log("Error while creating survey:", error);
//     return new ApiErrorResponse(500, {}, "Internal server error").send(res);
//   } finally {
//     connection.release();
//   }
// }

async function getSurveys(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];
  const status = req.query.status || "pending";

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    denos: ["sp.denos", "t.denos"],
    withdrawl_date: ["s.withdrawl_date"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    service_no: ["s.service_no"],
    issue_to: ["s.issue_to"],
    remarks_survey: ["s.remarks_survey"],
    withdrawl_qty: ["s.withdrawl_qty"],
    survey_quantity: ["s.survey_quantity"],
  };

  const connection = await pool.getConnection();

  try {
    let whereConditions = ["s.status = ?"];
    let queryParams = [status];

    if (search) {
      let searchConditions = [];

      // Normalize selected columns
      const validCols = rawCols
        .map((c) => c.trim())
        .filter((col) => columnMap[col]);

      // Split by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((word) => word.trim())
        .filter(Boolean);

      if (validCols.length > 0) {
        // When specific columns are selected
        for (const word of searchWords) {
          let wordConditions = [];

          for (const colName of validCols) {
            const dbColumns = columnMap[colName];

            for (const dbCol of dbColumns) {
              wordConditions.push(`${dbCol} LIKE ?`);
              queryParams.push(`%${word}%`);
            }
          }

          // Each word must match in any selected column
          searchConditions.push(`(${wordConditions.join(" OR ")})`);
        }

        // Combine words using AND
        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      } else {
        // Default fallback search (multi-word enabled)
        for (const word of searchWords) {
          searchConditions.push(`
        (
          sp.description LIKE ?
          OR t.description LIKE ?
        )
      `);

          queryParams.push(`%${word}%`, `%${word}%`);
        }

        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      }
    }

    const finalWhereClause = "WHERE " + whereConditions.join(" AND ");

    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM survey s 
             LEFT JOIN spares sp ON s.spare_id = sp.id 
             LEFT JOIN tools t ON s.tool_id = t.id 
             ${finalWhereClause}`,
      queryParams,
    );

    const totalDemand = totalCountRows[0].count;

    if (totalDemand === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        search ? "No matching demand found" : "No demand found",
      ).send(res);
    }

    const [rows] = await connection.query(
      `SELECT 
                s.*,
                pi.source_type,
                COALESCE(sp.description, t.description) as description,
                COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
                COALESCE(sp.category, t.category) as category,
                COALESCE(sp.denos, t.denos) as denos,
                COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
             FROM survey s
             LEFT JOIN spares sp ON s.spare_id = sp.id
             LEFT JOIN tools t ON s.tool_id = t.id
             LEFT JOIN pending_issue pi ON s.transaction_id = pi.transaction_id
             ${finalWhereClause} 
             ORDER BY s.id DESC
             LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalDemand,
        totalPages: Math.ceil(totalDemand / limit),
        currentPage: page,
      },
      "Survey retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting survey: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getLogSurveys(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];

  const columnMap = {
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    description: ["sp.description", "t.description"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    item_type: ["s.spare_id", "s.tool_id"],
    category: ["sp.category", "t.category"],
    denos: ["sp.denos", "t.denos"],
    survey_quantity: ["s.survey_quantity"],
    reason_for_survey: ["d.reason_for_survey"],
    survey_voucher_no: ["d.survey_voucher_no"],
    survey_date: ["d.survey_date"],
    remarks: ["d.remarks"],
    remarks_survey: ["s.remarks_survey"],
    withdrawl_qty: ["s.withdrawl_qty"],
    withdrawl_date: ["s.withdrawl_date"],
    service_no: ["s.service_no"],
    issue_to: ["s.issue_to"],
    created_at: ["s.created_at"],
  };

  const connection = await pool.getConnection();

  try {
    /* ---------- FORCE COMPLETED ---------- */
    let whereConditions = ["s.status = ?"];
    let queryParams = ["complete"];

    /* ---------- SEARCH ---------- */
    if (search) {
      let searchConditions = [];

      // Normalize selected columns
      const validCols = rawCols
        .map((c) => c.trim())
        .filter((col) => columnMap[col]);

      // Split by comma OR space
      const searchWords = search
        .split(/[,;\s]+/)
        .map((word) => word.trim())
        .filter(Boolean);

      if (validCols.length > 0) {
        // When specific columns are selected
        for (const word of searchWords) {
          let wordConditions = [];

          for (const colName of validCols) {
            const dbColumns = columnMap[colName];

            for (const dbCol of dbColumns) {
              wordConditions.push(`${dbCol} LIKE ?`);
              queryParams.push(`%${word}%`);
            }
          }

          // Each word must match in any selected column
          searchConditions.push(`(${wordConditions.join(" OR ")})`);
        }

        // Combine words using AND
        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      } else {
        // Default fallback search (multi-word enabled)
        for (const word of searchWords) {
          searchConditions.push(`
        (
          sp.description LIKE ?
          OR t.description LIKE ?
        )
      `);

          queryParams.push(`%${word}%`, `%${word}%`);
        }

        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      }
    }

    const finalWhereClause = "WHERE " + whereConditions.join(" AND ");

    /* ---------- COUNT ---------- */
    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM survey s 
       LEFT JOIN spares sp ON s.spare_id = sp.id 
       LEFT JOIN tools t ON s.tool_id = t.id
       LEFT JOIN demand d ON s.transaction_id = d.transaction_id
       ${finalWhereClause}`,
      queryParams,
    );

    const totalDemand = totalCountRows[0].count;

    if (totalDemand === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        "No completed survey found",
      ).send(res);
    }

    /* ---------- FETCH ROWS ---------- */
    const [rows] = await connection.query(
      `SELECT 
          s.*,
            d.reason_for_survey,
            d.survey_voucher_no,
            d.survey_date,
            d.remarks,
          COALESCE(sp.description, t.description) as description,
          COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
          COALESCE(sp.category, t.category) as category,
          COALESCE(sp.denos, t.denos) as denos,
          COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
       FROM survey s
       LEFT JOIN spares sp ON s.spare_id = sp.id
       LEFT JOIN tools t ON s.tool_id = t.id
       LEFT JOIN demand d ON s.transaction_id = d.transaction_id
       ${finalWhereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalDemand,
        totalPages: Math.ceil(totalDemand / limit),
        currentPage: page,
      },
      "Completed surveys retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting survey logs:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

// async function revertSurvey(req, res) {
//   const { survey_id } = req.body;
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();
//     const { id: userId } = req.user;

//     if (!survey_id) {
//       await connection.rollback();
//       return new ApiErrorResponse(400, {}, "survey_id is required").send(res);
//     }

//     let record = null;
//     let sourceTable = null;

//     /** =====================================================
//      * 1️⃣ Check SURVEY table first
//      ===================================================== */
//     const [[survey]] = await connection.query(
//       `SELECT * FROM survey WHERE id = ? FOR UPDATE`,
//       [survey_id],
//     );

//     if (survey) {
//       record = survey;
//       sourceTable = "survey";
//     } else {
//       /** =====================================================
//        * 2️⃣ If not found, check DEMAND table
//        ===================================================== */
//       const [[demand]] = await connection.query(
//         `SELECT * FROM demand WHERE id = ? FOR UPDATE`,
//         [survey_id],
//       );

//       if (!demand) {
//         await connection.rollback();
//         return new ApiErrorResponse(404, {}, "Record not found").send(res);
//       }

//       record = demand;
//       sourceTable = "demand";
//     }

//     if (record.status === "reversed") {
//       await connection.rollback();
//       return new ApiErrorResponse(400, {}, "Already reversed").send(res);
//     }

//     const itemId = record.spare_id || record.tool_id;
//     const tableName = record.spare_id ? "spares" : "tools";

//     /** =====================================================
//      * 3️⃣ Lock Inventory
//      ===================================================== */
//     const [[item]] = await connection.query(
//       `SELECT box_no, obs_held FROM ${tableName} WHERE id = ? FOR UPDATE`,
//       [itemId],
//     );

//     if (!item) {
//       await connection.rollback();
//       return new ApiErrorResponse(404, {}, "Item not found").send(res);
//     }

//     /** =====================================================
//      * 4️⃣ Fetch Box Ledger
//      ===================================================== */
//     const [boxLogs] = await connection.query(
//       `SELECT box_no, withdrawl_qty
//        FROM box_transaction
//        WHERE transaction_id = ?`,
//       [record.transaction_id],
//     );

//     if (!boxLogs.length) {
//       await connection.rollback();
//       return new ApiErrorResponse(
//         400,
//         {},
//         "No box transaction records found",
//       ).send(res);
//     }

//     /** =====================================================
//      * 5️⃣ Parse Current Boxes
//      ===================================================== */
//     let currentBoxes = [];
//     try {
//       currentBoxes = JSON.parse(item.box_no || "[]");
//     } catch {
//       currentBoxes = [];
//     }

//     /** =====================================================
//      * 6️⃣ Restore Per Box
//      ===================================================== */
//     const restoredBoxes = currentBoxes.map((box) => {
//       const match = boxLogs.find((log) => log.box_no == box.no);
//       if (!match) return box;

//       const restoreQty = Math.abs(Number(match.withdrawl_qty || 0));

//       return {
//         ...box,
//         qtyHeld: (Number(box.qtyHeld || 0) + restoreQty).toString(),
//       };
//     });

//     /** =====================================================
//      * 7️⃣ Restore OBS
//      ===================================================== */
//     const totalRestoreQty = boxLogs.reduce(
//       (sum, log) => sum + Math.abs(Number(log.withdrawl_qty || 0)),
//       0,
//     );

//     const previousOBS = Number(item.obs_held || 0);
//     const newOBS = previousOBS + totalRestoreQty;

//     /** =====================================================
//      * 8️⃣ Update Inventory
//      ===================================================== */
//     await connection.query(
//       `UPDATE ${tableName}
//        SET box_no = ?, obs_held = ?
//        WHERE id = ?`,
//       [JSON.stringify(restoredBoxes), newOBS, itemId],
//     );

//     /** =====================================================
//      * 9️⃣ Insert Reverse OBS Audit
//      ===================================================== */
//     await connection.query(
//       `INSERT INTO obs_audit (
//          transaction_id,
//          previous_obs,
//          new_obs
//        ) VALUES (?, ?, ?)`,
//       [record.transaction_id + "-REV", previousOBS, newOBS],
//     );

//     /** =====================================================
//      * 🔟 Mark Record Reversed
//      ===================================================== */
//     await connection.query(
//       `UPDATE ${sourceTable}
//        SET status = 'reversed',
//            reversed_by = ?,
//            reversed_at = NOW()
//        WHERE id = ?`,
//       [userId, survey_id],
//     );

//     await connection.commit();

//     return new ApiResponse(200, {}, "Transaction reverted successfully").send(
//       res,
//     );
//   } catch (error) {
//     await connection.rollback();
//     console.log("Error while reverting:", error);
//     return new ApiErrorResponse(500, {}, "Internal server error").send(res);
//   } finally {
//     connection.release();
//   }
// }

async function revertSurvey(req, res) {
  const { survey_id } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const { id: userId } = req.user;

    if (!survey_id) {
      await connection.rollback();
      return new ApiErrorResponse(400, {}, "survey_id is required").send(res);
    }

    let record = null;
    let sourceTable = null;

    /** =====================================================
     * 1️⃣ Check SURVEY table first
     ===================================================== */
    const [[survey]] = await connection.query(
      `SELECT * FROM survey WHERE id = ? FOR UPDATE`,
      [survey_id],
    );

    if (survey) {
      record = survey;
      sourceTable = "survey";
    } else {
      /** =====================================================
       * 2️⃣ If not found, check DEMAND table
       ===================================================== */
      const [[demand]] = await connection.query(
        `SELECT * FROM demand WHERE id = ? FOR UPDATE`,
        [survey_id],
      );

      if (!demand) {
        await connection.rollback();
        return new ApiErrorResponse(404, {}, "Record not found").send(res);
      }

      record = demand;
      sourceTable = "demand";
    }

    if (record.status === "reversed") {
      await connection.rollback();
      return new ApiErrorResponse(400, {}, "Already reversed").send(res);
    }

    const itemId = record.spare_id || record.tool_id;
    const tableName = record.spare_id ? "spares" : "tools";

    /** =====================================================
     * 3️⃣ Lock Inventory
     ===================================================== */
    const [[item]] = await connection.query(
      `SELECT box_no, obs_held FROM ${tableName} WHERE id = ? FOR UPDATE`,
      [itemId],
    );

    if (!item) {
      await connection.rollback();
      return new ApiErrorResponse(404, {}, "Item not found").send(res);
    }

    /** =====================================================
     * 4️⃣ Fetch Box Ledger
     ===================================================== */
    const [boxLogs] = await connection.query(
      `SELECT box_no, withdrawl_qty
       FROM box_transaction
       WHERE transaction_id = ?`,
      [record.transaction_id],
    );

    if (!boxLogs.length) {
      // No box logs exist → just restore OBS quantity
      const restoreQty = Number(
        record.survey_qty || record.repairable_qty || 0,
      );

      const previousOBS = Number(item.obs_held || 0);
      const newOBS = previousOBS + restoreQty;

      await connection.query(
        `UPDATE ${tableName}
     SET obs_held = ?
     WHERE id = ?`,
        [newOBS, itemId],
      );

      await connection.query(
        `UPDATE ${sourceTable}
     SET status = 'reversed'
     WHERE id = ?`,
        [survey_id],
      );

      await connection.commit();

      return new ApiResponse(200, {}, "Transaction reverted successfully").send(
        res,
      );
    }

    /** =====================================================
     * 5️⃣ Parse Current Boxes
     ===================================================== */
    let currentBoxes = [];
    try {
      currentBoxes = JSON.parse(item.box_no || "[]");
    } catch {
      currentBoxes = [];
    }

    /** =====================================================
     * 6️⃣ Restore Per Box
     ===================================================== */
    const restoredBoxes = currentBoxes.map((box) => {
      const match = boxLogs.find((log) => log.box_no == box.no);
      if (!match) return box;

      const restoreQty = Math.abs(Number(match.withdrawl_qty || 0));

      return {
        ...box,
        qtyHeld: (Number(box.qtyHeld || 0) + restoreQty).toString(),
      };
    });

    /** =====================================================
     * 7️⃣ Restore OBS
     ===================================================== */
    const totalRestoreQty = boxLogs.reduce(
      (sum, log) => sum + Math.abs(Number(log.withdrawl_qty || 0)),
      0,
    );

    const previousOBS = Number(item.obs_held || 0);
    const newOBS = previousOBS + totalRestoreQty;

    /** =====================================================
     * 8️⃣ Update Inventory
     ===================================================== */
    await connection.query(
      `UPDATE ${tableName}
       SET box_no = ?, obs_held = ?
       WHERE id = ?`,
      [JSON.stringify(restoredBoxes), newOBS, itemId],
    );

    /** =====================================================
     * 9️⃣ Insert Reverse OBS Audit
     ===================================================== */
    await connection.query(
      `INSERT INTO obs_audit (
         transaction_id,
         previous_obs,
         new_obs
       ) VALUES (?, ?, ?)`,
      [record.transaction_id + "-REV", previousOBS, newOBS],
    );

    /** =====================================================
     * 🔟 Mark Record Reversed
     ===================================================== */
    await connection.query(
      `UPDATE ${sourceTable}
   SET status = 'reversed'
   WHERE id = ?`,
      [survey_id],
    );

    await connection.commit();

    return new ApiResponse(200, {}, "Transaction reverted successfully").send(
      res,
    );
  } catch (error) {
    await connection.rollback();
    console.log("Error while reverting:", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function manualAddSurvey(req, res) {
  const { spare_id, tool_id, withdrawl_qty, survey_date } = req.body; // Add survey_date

  const { id: created_by } = req.user;

  try {
    const transactionId = "ADD_SUR-" + Date.now();

    let item;

    if (spare_id) {
      const [[row]] = await pool.query(
        `SELECT description, indian_pattern, category FROM spares WHERE id=?`,
        [spare_id],
      );
      item = row;
    }

    if (tool_id) {
      const [[row]] = await pool.query(
        `SELECT description, indian_pattern, category FROM tools WHERE id=?`,
        [tool_id],
      );
      item = row;
    }

    if (!withdrawl_qty || withdrawl_qty <= 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Withdrawal quantity required"));
    }

    if (!survey_date) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Survey date is required"));
    }

    await pool.query(
      `INSERT INTO survey (
        transaction_id,
        spare_id,
        tool_id,
        issue_to,
        withdrawl_qty,
        withdrawl_date,  -- This will now store the survey date for manual additions
        box_no,
        service_no,
        name,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        spare_id || null,
        tool_id || null,
        "---",
        withdrawl_qty,
        survey_date, // Use the provided survey date instead of null
        JSON.stringify([]),
        "---",
        "---",
        created_by,
      ],
    );

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Survey item added successfully"));
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getSurveyItems(req, res) {
  try {
    const { search = "", limit = 200, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        id, 
        description, 
        category, 
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
            items: rows.slice(0, 500), // Max 500 search results
            totalItems: rows.length,
            hasMore: rows.length > 500,
          },
          "Items fetched successfully",
        ),
      );
    }

    // Without search, return first 200 items
    query += ` ORDER BY description ASC LIMIT ? OFFSET ?`;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM spares WHERE category IN ('P', 'R')
        UNION ALL
        SELECT id FROM tools WHERE category IN ('P', 'R')
      ) AS combined
    `;
    const [countResult] = await pool.query(countQuery);
    const totalItems = countResult[0].total;

    const [rows] = await pool.query(query, [parseInt(limit), offset]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / parseInt(limit)),
        },
        "Items fetched successfully",
      ),
    );
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  createSurvey,
  getSurveys,
  getLogSurveys,
  revertSurvey,
  manualAddSurvey,
  getSurveyItems,
};
