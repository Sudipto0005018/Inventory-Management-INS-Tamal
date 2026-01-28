const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function createDepartment(req, res) {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "Name is required"));
    }
    try {
        const query = `
            INSERT INTO departments (name)
            VALUES (?);
        `;
        const [result] = await pool.query(query, [name]);
        if (result.length === 0) {
            return res
                .status(500)
                .json(new ApiErrorResponse(500, {}, "Department creation failed"));
        }
        res.status(201).json(new ApiResponse(201, result[0], "Department created successfully"));
    } catch (error) {
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function getDepartments(req, res) {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const extra = req.query?.extra || "";
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";
    try {
        let whereClause = "";
        let params = [];
        if (search) {
            whereClause = "WHERE name LIKE ?";
            params.push(`%${search}%`);
        }
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as count FROM departments ${whereClause}`,
            params
        );
        const totalDepartments = totalCount[0].count;

        if (totalDepartments === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { items: [], totalItems: 0, totalPages: 1, currentPage: page },
                        search ? "No matching departments found" : "No department found"
                    )
                );
        }

        const query = `
            SELECT * FROM departments ${whereClause}
            ORDER BY name ASC
            LIMIT ? OFFSET ?;
        `;
        const query2 = `
            SELECT * FROM departments ${whereClause}
            ORDER BY name ASC;
        `;
        const [rows] = await pool.query(extra !== "all" ? query : query2, [
            ...params,
            limit,
            offset,
        ]);
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    items: rows,
                    totalItems: totalDepartments,
                    totalPages: Math.ceil(totalDepartments / limit),
                    currentPage: page,
                },
                "Departments retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting departments: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function updateDepartment(req, res) {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "Name is required"));
    }
    try {
        const query = `
            UPDATE departments
            SET name = ?
            WHERE id = ?;
        `;
        const [result] = await pool.query(query, [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json(new ApiErrorResponse(404, {}, "Department not found"));
        }
        res.status(200).json(new ApiResponse(200, {}, "Department updated successfully"));
    } catch (error) {
        console.log("Error while updating department: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function deleteDepartment(req, res) {
    const { id } = req.params;
    try {
        const query = `
            DELETE FROM departments
            WHERE id = ?;
        `;
        const [result] = await pool.query(query, [id]);
        if (result.affectedRows === 0) {
            res.status(404).json(new ApiErrorResponse(404, {}, "Department not found"));
        } else {
            res.status(200).json(new ApiResponse(200, {}, "Department deleted successfully"));
        }
    } catch (error) {
        console.log("Error while deleting department: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

module.exports = { createDepartment, getDepartments, updateDepartment, deleteDepartment };
