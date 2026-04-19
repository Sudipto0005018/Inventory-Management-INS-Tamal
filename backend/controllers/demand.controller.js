const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { getSQLTimestamp } = require("../utils/helperFunctions");

async function createDemand(req, res) {
  const {
    spare_id,
    tool_id,
    survey_qty,
    survey_voucher_no,
    survey_date,
    transaction_id,
    reason_for_survey,
    remarks,
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!spare_id && !tool_id) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide spare_id or tool_id",
      ).send(res);
    }
    if (
      !survey_qty ||
      !survey_voucher_no ||
      !transaction_id ||
      !survey_date ||
      !reason_for_survey
    ) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide all required fields",
      ).send(res);
    }
    const [[row]] = await connection.query(
      `SELECT id, withdrawl_qty, survey_quantity FROM survey WHERE transaction_id = ?`,
      [transaction_id],
    );
    let status = "pending";

    if (row.withdrawl_qty < row.survey_quantity + Number(survey_qty)) {
      return new ApiErrorResponse(
        400,
        {},
        "Survey quantity is greater than withdrawl quantity",
      ).send(res);
    } else if (row.withdrawl_qty == row.survey_quantity + Number(survey_qty)) {
      status = "complete";
      await connection.query(
        `UPDATE survey SET status = ?, survey_quantity = ? WHERE id = ?`,
        [status, row.survey_quantity + Number(survey_qty), row.id],
      );
    } else {
      await connection.query(
        `UPDATE survey SET status = ?, survey_quantity = ? WHERE id = ?`,
        [status, row.survey_quantity + Number(survey_qty), row.id],
      );
    }
    await connection.query(
      `INSERT INTO demand (spare_id, tool_id, transaction_id, survey_qty, survey_voucher_no, survey_date, reason_for_survey, remarks, created_at, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        spare_id || null,
        tool_id || null,
        transaction_id,
        survey_qty,
        survey_voucher_no,
        survey_date,
        reason_for_survey,
        remarks || null,
        getSQLTimestamp(),
        req.user.id,
      ],
    );
    await connection.commit();
    new ApiResponse(201, {}, "Demand created successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.log("Error while creating demand: ", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getDemands(req, res) {
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
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    survey_qty: ["d.survey_qty"],
    survey_date: ["d.survey_date"],
    survey_voucher_no: ["d.survey_voucher_no"],
  };

  const connection = await pool.getConnection();

  try {
    // Alias 'd' for demand table
    let whereConditions = ["d.status = ?"];
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
        // Selected columns search
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

        // Combine words with AND
        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      } else {
        // Default fallback search (multi-word supported)
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

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";


    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM demand d 
             LEFT JOIN spares sp ON d.spare_id = sp.id 
             LEFT JOIN tools t ON d.tool_id = t.id 
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
                d.*,
                COALESCE(sp.description, t.description) as description,
                COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
                COALESCE(sp.category, t.category) as category,
                COALESCE(sp.denos, t.denos) as denos,
                COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern
             FROM demand d
             LEFT JOIN spares sp ON d.spare_id = sp.id
             LEFT JOIN tools t ON d.tool_id = t.id
             ${finalWhereClause} 
             ORDER BY d.id DESC
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
      "Demands retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting demands: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function createPendingIssue(req, res) {
  const {
    id,
    demand_no,
    demand_date,
    // Stocking fields
    mo_no,
    mo_date,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(`SELECT * FROM demand WHERE id = ?`, [
      id,
    ]);

    if (rows.length === 0) {
      await connection.rollback();
      return new ApiResponse(404, {}, "Demand not found").send(res);
    }

    const demand = rows[0];

    await connection.query(
      `
      INSERT INTO pending_issue (
        demand_no,
        demand_date,
        transaction_id,
        spare_id,
        tool_id,
        created_at,
        created_by,
        demand_quantity,

        mo_no,
        mo_date,
        status,
         source_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        demand_no,
        demand_date,
        demand.transaction_id,
        demand.spare_id,
        demand.tool_id,
        getSQLTimestamp(),
        req.user.id,
        demand.survey_qty,

        mo_no || null,
        mo_date || null,
        "pending",
        "demand",
      ],
    );

    await connection.query(
      `UPDATE demand SET status = 'complete' WHERE id = ?`,
      [id],
    );

    await connection.commit();

    new ApiResponse(201, {}, "Pending issue created successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.error("Error while creating pending issue:", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getPendingIssue(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];
  const status = req.query.status || "pending";

  const columnMap = {
    description: ["sp.description", "t.description"],
    category: ["sp.category", "t.category"],
    equipment_system: ["sp.equipment_system", "t.equipment_system"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
  };

  const connection = await pool.getConnection();

  try {
    // Alias 'pi' for pending_issue table
    let whereConditions = ["pi.status = ?"];
    let queryParams = [status];

    if (search) {
      let searchFragments = [];
      const validCols = rawCols.filter((col) => columnMap[col.trim()]);

      if (validCols.length > 0) {
        for (const colName of validCols) {
          const dbColumns = columnMap[colName.trim()];
          const subQuery = dbColumns
            .map((dbCol) => {
              queryParams.push(`%${search}%`);
              return `${dbCol} LIKE ?`;
            })
            .join(" OR ");
          searchFragments.push(`(${subQuery})`);
        }
      } else {
        searchFragments.push(`(sp.description LIKE ? OR t.description LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (searchFragments.length > 0) {
        whereConditions.push(`(${searchFragments.join(" OR ")})`);
      }
    }

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM pending_issue pi 
             LEFT JOIN spares sp ON pi.spare_id = sp.id 
             LEFT JOIN tools t ON pi.tool_id = t.id 
             ${finalWhereClause}`,
      queryParams,
    );

    const totalPending = totalCountRows[0].count;

    if (totalPending === 0) {
      return new ApiResponse(
        200,
        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
        search ? "No matching pending issue found" : "No pending issue found",
      ).send(res);
    }

    const [rows] = await connection.query(
      `SELECT 
                pi.*,
                COALESCE(sp.description, t.description) as description,
                COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
                COALESCE(sp.category, t.category) as category,
                COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern,
                COALESCE(sp.box_no, t.box_no) as box_no
             FROM pending_issue pi
             LEFT JOIN spares sp ON pi.spare_id = sp.id
             LEFT JOIN tools t ON pi.tool_id = t.id
             ${finalWhereClause} 
             ORDER BY pi.id DESC
             LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    return new ApiResponse(
      200,
      {
        items: rows,
        totalItems: totalPending,
        totalPages: Math.ceil(totalPending / limit),
        currentPage: page,
      },
      "Pending issues retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting pending issues: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function revertDemand(req, res) {
  const { demand_id } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (!demand_id) {
      return new ApiErrorResponse(400, {}, "Please provide demand_id").send(
        res,
      );
    }

    // 1️⃣ Get demand row
    const [[demandRow]] = await connection.query(
      `SELECT id, transaction_id, survey_qty, status 
       FROM demand 
       WHERE id = ?`,
      [demand_id],
    );

    if (!demandRow) {
      return new ApiErrorResponse(404, {}, "Demand not found").send(res);
    }

    if (demandRow.status === "reversed") {
      return new ApiErrorResponse(400, {}, "Demand already reversed").send(res);
    }

    // 2️⃣ Get survey row
    const [[surveyRow]] = await connection.query(
      `SELECT id, withdrawl_qty, survey_quantity 
       FROM survey 
       WHERE transaction_id = ?`,
      [demandRow.transaction_id],
    );

    if (!surveyRow) {
      return new ApiErrorResponse(404, {}, "Survey record not found").send(res);
    }

    const newSurveyQty =
      surveyRow.survey_quantity - Number(demandRow.survey_qty);

    // 3️⃣ Update survey back
    await connection.query(
      `UPDATE survey 
       SET survey_quantity = ?, status = 'pending'
       WHERE id = ?`,
      [newSurveyQty, surveyRow.id],
    );

    // 4️⃣ Mark demand reversed
    await connection.query(
      `UPDATE demand 
       SET status = 'reversed'
       WHERE id = ?`,
      [demandRow.id],
    );

    await connection.commit();

    new ApiResponse(200, {}, "Demand reverted successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.log("Error while reverting demand:", error);

    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function revertPendingIssue(req, res) {
  const { pending_issue_id } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (!pending_issue_id) {
      await connection.rollback();
      return new ApiErrorResponse(400, {}, "pending_issue_id is required").send(
        res,
      );
    }

    /** 1️⃣ Fetch Pending Issue */
    const [[pending]] = await connection.query(
      `SELECT * FROM pending_issue WHERE id = ? FOR UPDATE`,
      [pending_issue_id],
    );

    if (!pending) {
      await connection.rollback();
      return new ApiErrorResponse(404, {}, "Pending issue not found").send(res);
    }

    if (pending.status === "reversed") {
      await connection.rollback();
      return new ApiErrorResponse(
        400,
        {},
        "Pending issue already reversed",
      ).send(res);
    }

    /** 2️⃣ Find Demand using transaction_id */
    const [[demand]] = await connection.query(
      `SELECT id, status FROM demand WHERE transaction_id = ? FOR UPDATE`,
      [pending.transaction_id],
    );

    if (!demand) {
      await connection.rollback();
      return new ApiErrorResponse(404, {}, "Related demand not found").send(
        res,
      );
    }

    /** 3️⃣ Restore Demand Status */
    await connection.query(
      `UPDATE demand 
       SET status = 'pending'
       WHERE id = ?`,
      [demand.id],
    );

    /** 4️⃣ Mark Pending Issue as Reversed */
    await connection.query(
      `UPDATE pending_issue
       SET status = 'reversed'
       WHERE id = ?`,
      [pending_issue_id],
    );

    await connection.commit();

    return new ApiResponse(200, {}, "Pending issue reverted successfully").send(
      res,
    );
  } catch (error) {
    await connection.rollback();
    console.log("Error while reverting pending issue:", error);

    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

//from survey to stock update (Repair/Serviceable)

async function createRepairStock(req, res) {
  const { spare_id, tool_id, repairable_qty, transaction_id } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (!spare_id && !tool_id) {
      return new ApiErrorResponse(
        400,
        {},
        "Please provide spare_id or tool_id",
      ).send(res);
    }

    if (!repairable_qty || !transaction_id) {
      return new ApiErrorResponse(400, {}, "Repairable quantity required").send(
        res,
      );
    }

    const [[surveyRow]] = await connection.query(
      `SELECT id, withdrawl_qty, survey_quantity, box_no
       FROM survey
       WHERE transaction_id = ?`,
      [transaction_id],
    );

    if (!surveyRow) {
      return new ApiErrorResponse(404, {}, "Survey record not found").send(res);
    }

    if (
      surveyRow.withdrawl_qty <
      surveyRow.survey_quantity + Number(repairable_qty)
    ) {
      return new ApiErrorResponse(
        400,
        {},
        "Repairable qty exceeds withdrawal qty",
      ).send(res);
    }

    const newSurveyQty = surveyRow.survey_quantity + Number(repairable_qty);

    let status = "pending";

    if (surveyRow.withdrawl_qty === newSurveyQty) {
      status = "complete";
    }

    await connection.query(
      `UPDATE survey
       SET survey_quantity = ?, status = ?
       WHERE id = ?`,
      [newSurveyQty, status, surveyRow.id],
    );

    /** INSERT INTO STOCK UPDATE */
    await connection.query(
      `INSERT INTO stock_update
      (spare_id, tool_id, stocked_in_qty, issue_date, created_by, status, transaction_id, box_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        spare_id || null,
        tool_id || null,
        repairable_qty,
        new Date(),
        req.user.id,
        "pending",
        transaction_id,
        JSON.stringify(surveyRow.box_no),
      ],
    );

    await connection.commit();

    new ApiResponse(201, {}, "Repair stock added to pending").send(res);
  } catch (error) {
    await connection.rollback();
    console.log(error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

// /* UPDATE PENDING ISSUE //DISCARDED CODES */

async function updatePendingIssue(req, res) {
  const { id } = req.params;

  // const { nac_no, nac_date, validity, rate_unit, mo_no, mo_date, status } =
  //   req.body;

  const { mo_no, mo_date, status } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT id FROM pending_issue WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return new ApiResponse(404, {}, "Pending issue not found").send(res);
    }

    const updateFields = [];
    const updateValues = [];

    // if (nac_no !== undefined) {
    //   updateFields.push("nac_no = ?");
    //   updateValues.push(nac_no);
    // }

    // if (nac_date !== undefined) {
    //   updateFields.push("nac_date = ?");
    //   updateValues.push(nac_date);
    // }

    // if (validity !== undefined) {
    //   updateFields.push("validity = ?");
    //   updateValues.push(validity);
    // }

    // if (rate_unit !== undefined) {
    //   updateFields.push("rate_unit = ?");
    //   updateValues.push(parseFloat(rate_unit).toFixed(2));
    // }

    if (mo_no !== undefined) {
      updateFields.push("mo_no = ?");
      updateValues.push(mo_no);
    }

    if (mo_date !== undefined) {
      updateFields.push("mo_date = ?");
      updateValues.push(mo_date);
    }

    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      await connection.rollback();
      return new ApiResponse(400, {}, "No fields to update").send(res);
    }

    updateValues.push(id);

    const updateQuery = `
      UPDATE pending_issue
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    await connection.query(updateQuery, updateValues);

    await connection.commit();

    new ApiResponse(200, {}, "Pending issue updated successfully").send(res);
  } catch (error) {
    await connection.rollback();
    console.error("Error updating pending issue:", error);
    new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}

async function getDemandLogs(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const rawCols = req.query.cols ? req.query.cols.split(",") : [];
  // const status = req.query.status || "pending";

  const columnMap = {
    demand_no: ["pi.demand_no"],
    demand_date: ["pi.demand_date"],
    description: ["sp.description", "t.description"],
    indian_pattern: ["sp.indian_pattern", "t.indian_pattern"],
    category: ["sp.category", "t.category"],
    denos: ["sp.denos", "t.denos"],

    demand_quantity: ["pi.demand_quantity"],
    quote_authority: ["pi.quote_authority"],
    qty_received: ["pi.qty_received"],
    mo_no: ["pi.mo_no"],
    survey_voucher_no: ["d.survey_voucher_no"],
    survey_qty: ["d.survey_qty"],
    survey_date: ["d.survey_date"],
    created_at: ["d.created_at"],
  };

  const connection = await pool.getConnection();

  try {
    // Alias 'd' for demand table
    let whereConditions = ["d.status = ?"];
    let queryParams = ["complete"];

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
        // Selected columns search
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

        // Combine words with AND
        whereConditions.push(`(${searchConditions.join(" AND ")})`);
      } else {
        // Default fallback search (multi-word supported)
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

    const finalWhereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const [totalCountRows] = await connection.query(
      `SELECT COUNT(*) as count 
             FROM demand d 
             LEFT JOIN spares sp ON d.spare_id = sp.id 
             LEFT JOIN tools t ON d.tool_id = t.id
             LEFT JOIN pending_issue pi ON d.transaction_id = pi.transaction_id
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
      // `SELECT
      //           d.*,
      //            pi.demand_no,
      //            pi.demand_date,
      //            pi.demand_quantity,
      //            pi.quote_authority,
      //            pi.qty_received,
      //            pi.mo_no,
      //           COALESCE(sp.description, t.description) as description,
      //           COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
      //           COALESCE(sp.category, t.category) as category,
      //           COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern,
      //           COALESCE(sp.denos, t.denos) as denos
      //        FROM demand d
      //        LEFT JOIN spares sp ON d.spare_id = sp.id
      //        LEFT JOIN tools t ON d.tool_id = t.id
      //       LEFT JOIN pending_issue pi ON d.transaction_id = pi.transaction_id
      //        ${finalWhereClause}
      //        ORDER BY d.created_at DESC
      //        LIMIT ? OFFSET ?`,

      //*** =====================WRONG LOGIC====================================*///
      //    LEFT JOIN pending_issue pi
      // ON (d.spare_id = pi.spare_id OR d.tool_id = pi.tool_id)

      `SELECT 
    d.*,
    pi.demand_no,
    pi.demand_date,
    pi.demand_quantity,
    pi.quote_authority,
    pi.qty_received,
    pi.mo_no,

    COALESCE(sp.description, t.description) as description,
    COALESCE(sp.equipment_system, t.equipment_system) as equipment_system,
    COALESCE(sp.category, t.category) as category,
    COALESCE(sp.indian_pattern, t.indian_pattern) as indian_pattern,
    COALESCE(sp.denos, t.denos) as denos

    FROM demand d
    LEFT JOIN spares sp ON d.spare_id = sp.id
    LEFT JOIN tools t ON d.tool_id = t.id


  LEFT JOIN pending_issue pi 
ON d.transaction_id = pi.transaction_id
${finalWhereClause}

ORDER BY d.created_at DESC
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
      "Demands retrieved successfully",
    ).send(res);
  } catch (error) {
    console.log("Error while getting demands: ", error);
    return new ApiErrorResponse(500, {}, "Internal server error").send(res);
  } finally {
    connection.release();
  }
}


async function manualAddDemand(req, res) {
  const { spare_id, tool_id, survey_qty } = req.body;
  const { id: created_by } = req.user;

  try {
    if (!survey_qty || survey_qty <= 0) {
      return res.status(400).json({
        message: "Survey quantity must be greater than 0",
      });
    }

    const transactionId = "ADD_DM-" + Date.now();

    let item;

    if (spare_id) {
      const [[row]] = await pool.query(
        `SELECT description, indian_pattern, category
         FROM spares WHERE id=?`,
        [spare_id],
      );
      item = row;
    }

    if (tool_id) {
      const [[row]] = await pool.query(
        `SELECT description, indian_pattern, category
         FROM tools WHERE id=?`,
        [tool_id],
      );
      item = row;
    }

    await pool.query(
      `INSERT INTO demand (
        spare_id,
        tool_id,
        issue_to,
        transaction_id,
        survey_qty,
        survey_voucher_no,
        survey_date,
        created_at,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        spare_id || null,
        tool_id || null,
        "MANUAL",
        transactionId,
        survey_qty,
        "MANUAL",
        new Date(),
        created_by,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Demand item added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

module.exports = {
  createDemand,
  getDemands,
  createPendingIssue,
  getPendingIssue,
  updatePendingIssue,
  getDemandLogs,
  revertDemand,
  revertPendingIssue,
  createRepairStock,
  manualAddDemand,
};
