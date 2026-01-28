const jwt = require("jsonwebtoken");
const db = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");

const cookieOptions = {
  httpOnly: true,
  secure: true,
  expire: Date.now() + 1000 * 60 * 60 * process.env.COOKIE_EXPIRE, // 8 hours
  path: "/",
  sameSite: true,
};

const authMiddleware = async (req, res, next) => {
  let token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(400)
      .json(
        new ApiErrorResponse(
          400,
          {},
          "Not authorized or token expires, Please login again",
          true
        )
      );
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.username) {
      return res
        .status(400)
        .clearCookie("token", cookieOptions)
        .json(
          new ApiErrorResponse(
            400,
            {},
            "Invalid token, Please login again",
            true
          )
        );
    }
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      decoded.username,
    ]);

    if (rows.length > 0) {
      const user = { ...rows[0] };
      delete user.password;
      req.user = user;
      const [department] = await db.query(
        "SELECT id,name FROM departments WHERE id = ?",
        [user.department]
      );
      req.department = department[0];
      next();
    } else {
      return res
        .status(401)
        .clearCookie("token", cookieOptions)
        .json(
          new ApiErrorResponse(
            401,
            undefined,
            "User not found, Please login again",
            true
          )
        );
    }
  } catch (error) {
    return res
      .status(401)
      .clearCookie("token", cookieOptions)
      .json(
        new ApiErrorResponse(401, {}, "Invalid token, Please login again", true)
      );
  }
};

const isSuperAdmin = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json(
        new ApiErrorResponse(401, {}, "Not authorized, Please login again")
      );
  }
  const { role } = req.user;
  if (role?.toLowerCase() !== "superadmin") {
    return res
      .status(403)
      .json(new ApiErrorResponse(403, {}, "Access denied, Super Admin only"));
  }
  next();
};

const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json(
        new ApiErrorResponse(401, {}, "Not authorized, Please login again")
      );
  }
  console.log(req.user);

  const { role } = req.user;
  if (role?.toLowerCase() !== "admin") {
    return res
      .status(403)
      .json(new ApiErrorResponse(403, {}, "Access denied, Admin only"));
  }
  next();
};

const isUser = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json(
        new ApiErrorResponse(401, {}, "Not authorized, Please login again")
      );
  }
  const { role } = req.user;
  if (role?.toLowerCase() !== "user" && role?.toLowerCase() !== "admin") {
    return res.status(403).json(new ApiErrorResponse(403, {}, "Access denied"));
  }
  next();
};

module.exports = {
  authMiddleware,
  isSuperAdmin,
  isAdmin,
  isUser,
};
