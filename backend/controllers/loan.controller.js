const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function getPendingTYLoans(req, res) {
    const departmentID = req.department.id;
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause =
        "WHERE department = ? AND status = 'issued' AND issue_category = 'loan' AND loan_status = 'pending'";
    let params = [departmentID];
    try {
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as total from pending ${whereClause}`,
            params
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
                    "No ty-loans found"
                )
            );
        }
        whereClause += " LIMIT ? OFFSET ?";
        params.push(limit, offset);
        const query = `SELECT 
                        unit_name,
                        person_name,
                        service_name,
                        phone_no,
                        loan_duration,
                        conquered_by,
                        issue_box_no,
                        issue_date,
                        id,
                        status, 
                        quantity,
                        loan_status,
                        uid
                    FROM pending ${whereClause};`;
        const [rows] = await pool.query(query, params);
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            const uid = row.uid;
            const [item] = await pool.query(
                `SELECT * FROM spares WHERE uid = ? UNION ALL SELECT * FROM tools WHERE uid = ?`,
                [uid, uid]
            );
            delete item[0].id;
            const [total] = await pool.query(
                `SELECT SUM(quantity) as total from loan_transaction WHERE loan_id = ?`,
                [row.id]
            );
            rows[i] = { ...row, ...item[0], received_quantity: total[0].total };
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
                "TY loans retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting ty-loans: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function receiveTYLoan(req, res) {
    let { loan_id, date, quantity, issued_quantity } = req.body;
    if (!loan_id || !date || !quantity) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "Required fields are missing"));
    }
    quantity = parseInt(quantity);
    issued_quantity = parseInt(issued_quantity);
    try {
        let loan_status = "pending";
        if (issued_quantity == quantity) {
            loan_status = "complete";
        }
        const [rows] = await pool.query(
            `SELECT SUM(quantity) as total FROM loan_transaction WHERE loan_id = ?`,
            [loan_id]
        );
        const total = parseInt(rows[0].total);
        if (total + quantity > issued_quantity) {
            return res.status(400).json(new ApiErrorResponse(400, {}, "Quantity exceeded"));
        }
        if (total + quantity == issued_quantity) {
            loan_status = "complete";
        }
        await pool.query(`UPDATE pending SET loan_status = ? WHERE id = ?`, [loan_status, loan_id]);
        await pool.query(
            `INSERT INTO loan_transaction (loan_id, date, quantity) VALUES (?, ?, ?)`,
            [loan_id, date, quantity]
        );
        res.status(200).json(new ApiResponse(200, {}, "TY Loan received successfully"));
    } catch (error) {
        console.log("Error receiving TY Loan: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function getTYLoanReceiveHistory(req, res) {
    const { id } = req.params;
    let whereClause = "WHERE loan_id = ?";
    let params = [id];
    try {
        const [rows] = await pool.query(`SELECT * FROM loan_transaction ${whereClause}`, params);
        return res.status(200).json(new ApiResponse(200, rows, "History retrieved successfully"));
    } catch (error) {
        console.log("Error reading TY Loan: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function getCompletedTYLoans(req, res) {
    const departmentID = req.department.id;
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause =
        "WHERE department = ? AND status = 'issued' AND issue_category = 'loan' AND loan_status = 'complete'";
    let params = [departmentID];
    try {
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as total from pending ${whereClause}`,
            params
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
                    "No ty-loans found"
                )
            );
        }
        whereClause += " LIMIT ? OFFSET ?";
        params.push(limit, offset);
        const query = `SELECT 
                        unit_name,
                        person_name,
                        service_name,
                        phone_no,
                        loan_duration,
                        conquered_by,
                        issue_box_no,
                        issue_date,
                        id,
                        status, 
                        quantity,
                        loan_status,
                        uid
                    FROM pending ${whereClause};`;
        const [rows] = await pool.query(query, params);
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            const uid = row.uid;
            const [item] = await pool.query(
                `SELECT * FROM spares WHERE uid = ? UNION ALL SELECT * FROM tools WHERE uid = ?`,
                [uid, uid]
            );
            const [total] = await pool.query(
                `SELECT SUM(quantity) as total from loan_transaction WHERE loan_id = ?`,
                [row.id]
            );
            delete item[0].id;
            rows[i] = { ...row, ...item[0], received_quantity: total[0].total };
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
                "TY loans retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting ty-loans: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function getPendingTempLoans(req, res) {
    const departmentID = req.department.id;
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause =
        "WHERE department = ? AND status = 'issued' AND issue_category = 'temporary' AND loan_status = 'pending'";
    let params = [departmentID];
    try {
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as total from pending ${whereClause}`,
            params
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
                    "No temporary loans found"
                )
            );
        }
        whereClause += " LIMIT ? OFFSET ?";
        params.push(limit, offset);
        const query = `SELECT 
                        issued_to,
                        loan_duration,
                        issue_box_no,
                        issue_date,
                        id,
                        status,
                        quantity,
                        loan_status,
                        uid
                    FROM pending ${whereClause};`;
        const [rows] = await pool.query(query, params);
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            const uid = row.uid;
            const [item] = await pool.query(
                `SELECT * FROM spares WHERE uid = ? UNION ALL SELECT * FROM tools WHERE uid = ?`,
                [uid, uid]
            );
            const [total] = await pool.query(
                `SELECT SUM(quantity) as total from temp_loan_transaction WHERE loan_id = ?`,
                [row.id]
            );
            delete item[0].id;
            rows[i] = { ...row, ...item[0], received_quantity: total[0].total };
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
                "Temporary loans retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting ty-loans: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function receiveTempLoan(req, res) {
    let { loan_id, date, quantity, issued_quantity } = req.body;
    if (!loan_id || !date || !quantity) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "Required fields are missing"));
    }
    quantity = parseInt(quantity);
    issued_quantity = parseInt(issued_quantity);
    try {
        let loan_status = "pending";
        if (issued_quantity == quantity) {
            loan_status = "complete";
        }
        const [rows] = await pool.query(
            `SELECT SUM(quantity) as total FROM temp_loan_transaction WHERE loan_id = ?`,
            [loan_id]
        );
        const total = parseInt(rows[0].total);
        if (total + quantity > issued_quantity) {
            return res.status(400).json(new ApiErrorResponse(400, {}, "Quantity exceeded"));
        }
        if (total + quantity == issued_quantity) {
            loan_status = "complete";
        }
        if (loan_status == "complete")
            await pool.query(`UPDATE pending SET loan_status = ? WHERE id = ?`, [
                loan_status,
                loan_id,
            ]);
        await pool.query(
            `INSERT INTO temp_loan_transaction (loan_id, date, quantity) VALUES (?, ?, ?)`,
            [loan_id, date, quantity]
        );
        res.status(200).json(new ApiResponse(200, {}, "Temporary Loan received successfully"));
    } catch (error) {
        console.log("Error receiving TY Loan: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function getTempLoanReceiveHistory(req, res) {
    const { id } = req.params;
    let whereClause = "WHERE loan_id = ?";
    let params = [id];
    try {
        const [rows] = await pool.query(
            `SELECT * FROM temp_loan_transaction ${whereClause}`,
            params
        );
        return res.status(200).json(new ApiResponse(200, rows, "History retrieved successfully"));
    } catch (error) {
        console.log("Error reading TY Loan: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function getCompletedTempLoans(req, res) {
    const departmentID = req.department.id;
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause =
        "WHERE department = ? AND status = 'issued' AND issue_category = 'temporary' AND loan_status = 'complete'";
    let params = [departmentID];
    try {
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as total from pending ${whereClause}`,
            params
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
                    "No temporary loans found"
                )
            );
        }
        whereClause += " LIMIT ? OFFSET ?";
        params.push(limit, offset);
        const query = `SELECT 
                        issued_to,
                        loan_duration,
                        issue_box_no,
                        issue_date,
                        id,
                        status,
                        quantity,
                        loan_status,
                        uid
                    FROM pending ${whereClause};`;
        const [rows] = await pool.query(query, params);
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            const uid = row.uid;
            const [item] = await pool.query(
                `SELECT * FROM spares WHERE uid = ? UNION ALL SELECT * FROM tools WHERE uid = ?`,
                [uid, uid]
            );
            const [total] = await pool.query(
                `SELECT SUM(quantity) as total from temp_loan_transaction WHERE loan_id = ?`,
                [row.id]
            );
            delete item[0].id;
            rows[i] = { ...row, ...item[0], received_quantity: total[0].total };
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
                "Temporary loans retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting ty-loans: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

module.exports = {
    getPendingTYLoans,
    receiveTYLoan,
    getTYLoanReceiveHistory,
    getCompletedTYLoans,
    getPendingTempLoans,
    receiveTempLoan,
    getTempLoanReceiveHistory,
    getCompletedTempLoans,
};
