const express = require("express");
const router = express.Router();

const {
  signup,
  signIn,
  signOut,
  verifySession,
  getUsers,
  getDashboardData,
  updateUser,
} = require("../controllers/users.controller");
const { authMiddleware, isSuperAdmin } = require("../middlewares/auth");

router.post("/signup", signup);
router.post("/signin", signIn);
router.get("/signout", signOut);
router.get("/verify", verifySession);
router.get("/", authMiddleware, isSuperAdmin, getUsers);
router.get("/dashboard", getDashboardData);
router.post("/update/:id", updateUser);

module.exports = router;
