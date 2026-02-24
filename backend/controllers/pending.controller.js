const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { mergeAndSubArrays } = require("../utils/helperFunctions");

async function getPendingList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;
  try {
    let whereClause = `WHERE department = ? AND (status = 'pending' OR status IS NULL)`;
    let params = [department.id];
    if (search) {
      whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    let [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM pending ${whereClause}`,
      params,
    );
    let total = totalCount[0].count;

    // [totalCount] = await pool.query(
    //     `SELECT COUNT(*) as count FROM tools ${whereClause}`,
    //     params
    // );
    // total += totalCount[0].count;
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
          search ? "No matching item found" : "No item found",
        ),
      );
    }
    // const selectedCols =
    //     "id, description, equipment_system, category, denos, status, demand_type";
    // const query = `
    //     SELECT ${selectedCols}, 'spares' AS source FROM spares ${whereClause}
    //     UNION ALL
    //     SELECT ${selectedCols}, 'tools' AS source FROM tools ${whereClause}
    //     ORDER BY description ASC
    //     LIMIT ? OFFSET ?;
    // `;
    const query = `
            SELECT * FROM pending ${whereClause}
            LIMIT ? OFFSET ?;
        `;
    const [rows] = await pool.query(query, [...params, limit, offset]);
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      const uid = row.uid;
      const [item] = await pool.query(
        `SELECT *, 'spares' AS source FROM spares WHERE uid = ? UNION ALL SELECT *, 'tools' AS source FROM tools WHERE uid = ?`,
        [uid, uid],
      );
      delete item[0].id;
      rows[i] = { ...row, ...item[0] };
    }
    await res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "items retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error while getting items: ", error);
    res.status.json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getNonPendingList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department;
  try {
    let whereClause = `WHERE department = ? AND (status != 'pending' AND status IS NOT NULL AND issue_category = 'permanent') AND loan_status = 'pending'`;
    let params = [department.id];
    if (search) {
      whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    let [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM pending ${whereClause}`,
      params,
    );
    let total = totalCount[0].count;
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
          search ? "No matching item found" : "No item found",
        ),
      );
    }
    const query = `
            SELECT * FROM pending ${whereClause}
            LIMIT ? OFFSET ?;
        `;
    const [rows] = await pool.query(query, [...params, limit, offset]);
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      const uid = row.uid;
      const [item] = await pool.query(
        `SELECT description, id as item_id, box_no, 'spares' AS source, category FROM spares WHERE uid = ? 
                UNION ALL 
                SELECT description, id as item_id, box_no, 'tools' AS source, category FROM tools WHERE uid = ?`,
        [uid, uid],
      );
      const [total] = await pool.query(
        `SELECT SUM(quantity) as total FROM permanent_transaction WHERE pending_id = ?`,
        [row.id],
      );
      delete item[0].id;
      rows[i] = { ...row, ...item[0], survey_quantity: total[0].total || 0 };
    }
    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "items retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error while getting items: ", error);
    res.status.json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function issueCategory(req, res) {
  const { id, issue_category } = req.body;
  if (!id || !issue_category) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  try {
    const query = `
            UPDATE pending
            SET issue_category = ?, loan_status = 'pending'
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [issue_category, id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Item not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Item issued successfully"));
  } catch (error) {
    console.log("Error while issueing item: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function issueTemporaryProduct(req, res) {
  const { id, issued_to, issue_date, box_no, loan_duration } = req.body;
  try {
    if (!id || !issued_to || !issue_date || !box_no || !loan_duration) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "All fields are required"));
    }
    const quantity = JSON.parse(box_no)
      .map((box) => parseInt(box.qn))
      .reduce((a, b) => a + b, 0);
    const query = `
            UPDATE pending
            SET issued_to = ?, quantity = ?, status = 'issued', issue_box_no = ?, issue_date = ?, loan_duration = ?
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [
      issued_to,
      quantity,
      box_no,
      issue_date,
      loan_duration,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Item not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Item issued successfully"));
  } catch (error) {
    console.log("Error while issuing temporary loan: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function issueLoanProduct(req, res) {
  const {
    id,
    unit_name,
    person_name,
    service_name,
    phone_no,
    loan_duration,
    conquered_by,
    box_no,
    issue_date,
  } = req.body;
  if (
    !id ||
    !unit_name ||
    !person_name ||
    !service_name ||
    !phone_no ||
    !loan_duration ||
    !conquered_by ||
    !box_no
  ) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }
  try {
    const quantity = JSON.parse(box_no)
      .map((box) => parseInt(box.qn))
      .reduce((a, b) => a + b, 0);
    const query = `
            UPDATE pending 
            SET unit_name = ?, person_name = ?, service_name = ?, phone_no = ?, loan_duration = ?, conquered_by = ?, issue_box_no = ?, status = 'issued', quantity = ?, issue_date = ?
            WHERE id = ?;
        `;

    const [result] = await pool.query(query, [
      unit_name,
      person_name,
      service_name,
      phone_no,
      loan_duration,
      conquered_by,
      box_no,
      quantity,
      issue_date,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Item not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Item issued successfully"));
  } catch (error) {
    console.log("Error issuing loan: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function issuePermanentProduct(req, res) {
  const { id, issued_to, issue_date, box_no, uid, source, current_box } =
    req.body;
  if (!id || !issued_to || !issue_date || !box_no) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "Required fields are missing"));
  }

  try {
    const boxes = JSON.parse(box_no);
    const currBoxes = JSON.parse(current_box);
    const quantity = boxes
      .map((box) => parseInt(box.qn))
      .reduce((a, b) => a + b, 0);
    const query = `
            UPDATE pending
            SET issued_to = ?, quantity = ?, status = 'issued', issue_box_no = ?, issue_date = ?
            WHERE id = ?;
        `;
    const resultBox = mergeAndSubArrays(currBoxes, boxes);
    const obsHeld = resultBox
      .map((box) => parseInt(box.qn))
      .reduce((a, b) => a + b, 0);

    const [result] = await pool.query(query, [
      issued_to,
      quantity,
      box_no,
      issue_date,
      id,
    ]);
    await pool.query(
      `UPDATE ${source} SET box_no = ?, obs_held = ? WHERE uid = ?`,
      [JSON.stringify(resultBox), obsHeld, uid],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Item not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Item issued successfully"));
  } catch (error) {
    console.log("Error while issueing permanent item: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function servayProduct(req, res) {
  const { id, voucher_no, survey_date, quantity, issued_quantity } = req.body;

  if (!id || !voucher_no) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }
  try {
    let loan_status = "pending";
    const [total] = await pool.query(
      `SELECT SUM(quantity) as total FROM permanent_transaction WHERE pending_id = ?`,
      [id],
    );
    const servayedQuantity = parseInt(total[0].total);
    if (parseInt(issued_quantity) == parseInt(quantity)) {
      loan_status = "complete";
    } else if (
      parseInt(issued_quantity) <
      parseInt(quantity) + servayedQuantity
    ) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "Quantity exceeded"));
    } else if (
      parseInt(issued_quantity) ==
      parseInt(quantity) + servayedQuantity
    ) {
      loan_status = "complete";
    }
    if (loan_status == "complete") {
      await pool.query(`UPDATE pending SET loan_status = ? WHERE id = ?`, [
        loan_status,
        id,
      ]);
    }

    const query = `
                INSERT INTO permanent_transaction (quantity, date, voucher_no, pending_id, status)
                VALUES (?, ?, ?, ?, 'surveyed');
        `;
    await pool.query(query, [quantity, survey_date, voucher_no, id]);
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Item surveyed successfully"));
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function getSurveyedProducts(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const search = req.query?.search || "";
  const offset = (page - 1) * limit;
  const department = req.department.id;
  const query = `
        SELECT
            pt.*, p.uid, p.issue_date
        FROM
            permanent_transaction AS pt
        JOIN
            pending AS p
        ON
            pt.pending_id = p.id
        WHERE
            p.department = ?  AND pt.status <> 'inventory' 
        LIMIT ? OFFSET ?;
    `;
  try {
    const [totalCount] = await pool.query(
      `
            SELECT
                COUNT(*) AS total
            FROM
                permanent_transaction AS pt
            JOIN
                pending AS p
            ON
                pt.pending_id = p.id
            WHERE
                p.department = ? AND pt.status <> 'pending_stock';    
        `,
      [department],
    );
    const total = totalCount[0].total;
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
          search ? "No matching item found" : "No item found",
        ),
      );
    }
    const [rows] = await pool.query(query, [department, limit, offset]);
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      const uid = row.uid;
      const [item] = await pool.query(
        `SELECT description, id as item_id, box_no, 'spares' AS source, category FROM spares WHERE uid = ? 
                UNION ALL 
                SELECT description, id as item_id, box_no, 'tools' AS source, category FROM tools WHERE uid = ?`,
        [uid, uid],
      );
      delete item[0].id;
      rows[i] = { ...row, ...item[0] };
    }
    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "items retrieved successfully",
      ),
    );
  } catch (error) {
    console.log("Error while getting servays: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function demandProduct(req, res) {
  const { id, demand_no, demand_date } = req.body;
  if (!id || !demand_no || !demand_date) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }
  try {
    const query = `
            UPDATE permanent_transaction
                SET demand_no = ?, status = 'demanded', demand_date = ?
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [demand_no, demand_date, id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Product not found"));
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Product demanded successfully"));
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function nacProduct(req, res) {
  const { id, nac_no, nac_date, rate, validity } = req.body;
  if (!id || !nac_no || !nac_date || !rate || !validity) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }
  try {
    const query = `
            UPDATE permanent_transaction
                SET nac_no = ?, status = 'naced', nac_date = ?, rate = ?, validity = ?
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [
      nac_no,
      nac_date,
      rate,
      validity,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Product not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Product NAC successfully"));
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function stockingProduct(req, res) {
  const { id, mo_no, gate_pass_date } = req.body;
  if (!id || !mo_no || !gate_pass_date) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "All fields are required"));
  }
  try {
    const query = `
            UPDATE permanent_transaction
                SET mo_no = ?, status = 'stocked', gate_pass_date = ?
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [mo_no, gate_pass_date, id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Product not found"));
    }
    res.status(200).json(new ApiResponse(200, {}, "Product NAC successfully"));
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function addInInventory(req, res) {
  const { id, box_no, source, uid } = req.body;
  if (!id || !box_no || !source || !uid) {
    return res.json(new ApiErrorResponse(400, {}, "All fields are required"));
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE permanent_transaction SET status = 'inventory' WHERE id = ?`,
      [id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "item not found"));
    }
    let boxes = JSON.parse(box_no);
    let obs_held = 0;
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].qn = parseInt(boxes[i].qn) + parseInt(boxes[i].wd || "0");
      delete boxes[i].wd;
      obs_held += boxes[i].qn;
    }
    const [result2] = await connection.execute(
      `UPDATE ${source} SET box_no = ?, obs_held = ? WHERE uid = ?`,
      [JSON.stringify(boxes), obs_held, uid],
    );
    if (result2.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json(new ApiErrorResponse(400, {}, "item not found"));
    }
    await connection.commit();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Item added to inventory successfully"));
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.log("Error while adding inventory: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  } finally {
    if (connection) connection.release();
  }
}

async function printQR(req, res) {
  const PDFDocument = require("pdfkit");
  const qr = require("qrcode");

  const { id, source } = req.body;
  try {
    const query = `
            SELECT * FROM ${source}
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [id]);
    if (result.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Product not found"));
    }
    const product = result[0];
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
    const qrText = `Description: ${product.description}|IN Pattern No :${product.indian_pattern}|Item id: ${product.uid}`;
    const qrUrl = await qr.toDataURL(qrText, { margin: 0, width: 120 });
    doc.image(qrUrl, 5, 5, { width: 60, height: 60 });
    doc.end();
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function pendingIssue(req, res) {
  const { id, source } = req.body;
  try {
    const query = `
            UPDATE ${source}
            SET status = 'pending_stock'
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Product not found"));
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Product issued successfully"));
  } catch (error) {
    console.log("Error while getting spares: ", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

async function addQRCodeResults(req, res) {
  const { qrs } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    for (let i = 0; i < qrs.length; i++) {
      const qr = qrs[i];
      let query = `SELECT * FROM spares WHERE uid = ? UNION ALL SELECT * FROM tools WHERE uid = ?;`;
      const [result] = await connection.query(query, [qr, qr]);
      if (result.length === 0) {
        console.log(qr);
      }

      query = `INSERT INTO pending (uid, department, status) VALUES (?, ?, ?);`;
      await connection.query(query, [qr, req.department.id, "pending"]);
    }
    await connection.commit();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "QR codes added successfully"));
  } catch (error) {
    console.log("Error adding qrs: ", error);
    await connection.rollback();
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  } finally {
    if (connection) connection.release();
  }
}

async function getCompletedPermanentIssues(req, res) {
  const departmentID = req.department.id;
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const query = `
        SELECT
            pt.*, p.uid, p.issue_date, p.department, p.issued_to, p.quantity as issued_quantity
        FROM
            permanent_transaction AS pt
        JOIN
            pending AS p
        ON
            pt.pending_id = p.id
        WHERE 
            p.department = ? AND pt.status = 'inventory'
        LIMIT ? OFFSET ?;
    `;
  try {
    const [totalCount] = await pool.query(
      `
            SELECT
                COUNT(*) AS total
            FROM
                permanent_transaction AS pt
            JOIN
                pending AS p
            ON
                pt.pending_id = p.id
            WHERE
                p.department = ? AND pt.status = 'inventory';    
        `,
      [departmentID],
    );
    const total = totalCount[0].total;
    if (total === 0) {
      return res.status(200).json(
        new ApiResponse(200, {
          items: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
        }),
      );
    }
    const [rows] = await pool.query(query, [departmentID, limit, offset]);
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      const uid = row.uid;
      const [item] = await pool.query(
        `SELECT description, id as item_id, box_no, 'spares' AS source, category FROM spares WHERE uid = ? 
                UNION ALL 
                SELECT description, id as item_id, box_no, 'tools' AS source, category FROM tools WHERE uid = ?`,
        [uid, uid],
      );
      delete item[0].id;
      rows[i] = { ...row, ...item[0] };
    }
    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "items retrieved successfully",
      ),
    );
  } catch (error) {}
}

module.exports = {
  getPendingList,
  getNonPendingList,
  issueCategory,
  issueTemporaryProduct,
  servayProduct,
  demandProduct,
  nacProduct,
  printQR,
  pendingIssue,
  addQRCodeResults,
  issueLoanProduct,
  issuePermanentProduct,
  getSurveyedProducts,
  stockingProduct,
  addInInventory,
  getCompletedPermanentIssues,
};
