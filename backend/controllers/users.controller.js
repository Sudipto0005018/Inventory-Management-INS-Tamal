const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const { validateUsername } = require("../utils/helperFunctions");

const cookieOptions = {
    httpOnly: true,
    secure: true,
    expire: Date.now() + 1000 * 60 * 60 * process.env.COOKIE_EXPIRE, // 8 hours
    path: "/",
    sameSite: true,
};

async function signup(req, res) {
    const { name, username, password, department, role } = req.body;
    if (!name || !username || !password || !department) {
        return res
            .status(400)
            .json(new ApiErrorResponse(400, {}, "Name, username and password are required"));
    }

    if (!validateUsername(username)) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "Invalid username format"));
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (name, username, password, department, role)
            VALUES (?, ?, ?, ?, ?);
        `;
        const [result] = await pool.query(query, [
            name,
            username,
            hashedPassword,
            department,
            role || "user",
        ]);

        if (result.length === 0) {
            return res.status(500).json(new ApiErrorResponse(500, {}, "User creation failed"));
        }

        res.status(201).json(new ApiResponse(201, result[0], "User created successfully"));
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(500).json(new ApiErrorResponse(500, {}, "username already taken"));
        }
        console.error("Error during user signup:", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

async function signIn(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json(new ApiErrorResponse(400, {}, "All fields are required"));
    }

    const query = `SELECT * FROM users WHERE username = ?`;

    try {
        const [rows] = await pool.query(query, [username.toLowerCase()]);
        if (rows.length === 0) {
            return res.status(404).json(new ApiErrorResponse(404, {}, "Invalid credentials"));
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json(new ApiErrorResponse(401, {}, "Invalid credentials"));
        }

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || "8h",
        });

        const { password: _, ...userSafe } = user;
        userSafe.token = token;

        return res
            .status(200)
            .cookie("token", token, cookieOptions)
            .json(new ApiResponse(200, { user: userSafe }, "User signed in successfully"));
    } catch (error) {
        console.error("SignIn error:", error);
        return res
            .status(500)
            .json(new ApiErrorResponse(500, {}, error.message || "Internal server error"));
    }
}

async function signOut(req, res) {
    return res
        .clearCookie("token", cookieOptions)
        .status(200)
        .json(new ApiResponse(200, {}, "User signed out successfully"));
}

async function verifySession(req, res) {
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res
            .status(400)
            .json(
                new ApiErrorResponse(400, {}, "Not authorized or token expires, Please login again")
            );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { username } = decoded;

        const userTable = `users`;
        const query = `SELECT * FROM ${userTable} WHERE username = ?`;
        const [rows] = await pool.query(query, [username]);

        if (rows.length === 0) {
            return res.status(401).json(new ApiErrorResponse(401, {}, "Unauthorized"));
        }

        const newToken = jwt.sign({ username }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || "8h",
        });

        const { password: _, ...userSafe } = rows[0];
        userSafe.token = newToken;

        return res
            .status(200)
            .cookie("token", newToken, cookieOptions)
            .json(new ApiResponse(200, { user: userSafe }, "User signed in successfully"));
    } catch (error) {
        return res.status(401).json(new ApiErrorResponse(401, {}, "Unauthorized"));
    }
}

async function getUsers(req, res) {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const search = req.query?.search || "";
    const offset = (page - 1) * limit;
    try {
        let whereClause = "WHERE role != 'superadmin'";
        let params = [];
        if (search) {
            whereClause += " AND (name LIKE ? OR username LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as count FROM users ${whereClause}`,
            params
        );
        const totalUsers = totalCount[0].count;
        if (totalUsers === 0) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        items: [],
                        totalItems: 0,
                        totalPages: 1,
                        currentPage: page,
                    },
                    search ? "No matching users found" : "No user found"
                )
            );
        }
        const query = `
            SELECT * FROM users ${whereClause}
            ORDER BY name ASC
            LIMIT ? OFFSET ?;
        `;
        const [rows] = await pool.query(query, [...params, limit, offset]);

        for (let i = 0; i < rows.length; i++) {
            const user = rows[i];
            delete user.password;
            const [department] = await pool.query("SELECT id,name FROM departments WHERE id = ?", [
                user.department,
            ]);
            if (department.length === 0) continue;
            user.department = department[0].name;
            user.departmentId = department[0].id;
        }
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    items: rows,
                    totalItems: totalUsers,
                    totalPages: Math.ceil(totalUsers / limit),
                    currentPage: page,
                },
                "Users retrieved successfully"
            )
        );
    } catch (error) {
        console.log("Error while getting users: ", error);
        res.status(500).json(new ApiErrorResponse(500, {}, "Internal server error"));
    }
}

module.exports = { signup, signIn, signOut, verifySession, getUsers };
