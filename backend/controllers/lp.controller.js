const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

const createLP = async (req, res) => {
    const {
        description,
        equipment_system,
        denos,
        obs_authorised,
        obs_held,
        box_no,
        storage_location,
        remarks,
    } = req.body;
    const department = req.department;
    try {
        if (!description || !equipment_system) {
            return res.status(400).json(new ApiErrorResponse(400, {}, "All fields are required"));
        }
        const query = `
            INSERT INTO lp
                (description, equipment_system, denos, obs_authorised, obs_held, box_no, storage_location, remarks, department)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const [result] = await pool.query(query, [
            description,
            equipment_system,
            denos || null,
            obs_authorised || null,
            obs_held || null,
            box_no || null,
            storage_location || null,
            remarks || null,
            department.id,
        ]);
        if (result.length === 0) {
            return res.status(500).json(new ApiErrorResponse(500, {}, "LP creation failed"));
        }
        res.status(201).json(new ApiResponse(201, result[0], "LP created successfully"));
    } catch (error) {
        console.log("Error creating spare: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
};

async function getLPs(req, res) {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const search = req.query?.search || "";
    const offset = (page - 1) * limit;
    const department = req.department;

    try {
        let whereClause = "WHERE department = ?";
        let params = [department.id];
        if (search) {
            whereClause += " AND (description LIKE ? OR equipment_system LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as count FROM lp ${whereClause}`,
            params
        );
        const totalSpares = totalCount[0].count;
        if (totalSpares === 0) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        items: [],
                        totalItems: 0,
                        totalPages: 1,
                        currentPage: page,
                    },
                    search ? "No matching spares found" : "No spare found"
                )
            );
        }

        const query = `
            SELECT * FROM lp ${whereClause}
            ORDER BY description ASC
            LIMIT ? OFFSET ?;
        `;
        const [rows] = await pool.query(query, [...params, limit, offset]);
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    items: rows,
                    totalItems: totalSpares,
                    totalPages: Math.ceil(totalSpares / limit),
                    currentPage: page,
                },
                "LP retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting spares: ", error);
        res.status.json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function updateLP(req, res) {
    const { id } = req.params;
    const {
        description,
        equipment_system,
        denos,
        obs_authorised,
        obs_held,
        box_no,
        storage_location,
        remarks,
    } = req.body;
    if (!description || !equipment_system) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "All fields are required"));
    }
    try {
        const query = `
            UPDATE lp
            SET description = ?, equipment_system = ?, denos = ?, obs_authorised = ?, obs_held = ?, box_no = ?, storage_location = ?, remarks = ?
            WHERE id = ?;
        `;
        const [result] = await pool.query(query, [
            description,
            equipment_system,
            denos || null,
            obs_authorised || null,
            obs_held || null,
            box_no || null,
            storage_location || null,
            remarks || null,
            id,
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json(new ApiErrorResponse(404, {}, "LP not found"));
        }
        res.status(200).json(new ApiResponse(200, {}, "LP updated successfully"));
    } catch (error) {
        console.log("Error while updating spare: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function deleteLP(req, res) {
    const { id } = req.params;
    try {
        const query = `
            DELETE FROM lp
            WHERE id = ?;
        `;
        const [result] = await pool.query(query, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json(new ApiErrorResponse(404, {}, "LP not found"));
        }
        res.status(200).json(new ApiResponse(200, {}, "LP deleted successfully"));
    } catch (error) {
        console.log("Error while deleting lp: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

module.exports = { createLP, getLPs, updateLP, deleteLP };
