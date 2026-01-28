const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  isAdmin,
  isSuperAdmin,
} = require("../middlewares/auth");
const {
  getAllApprovalPendings,
  approveChange,
  rejectChange,
  worklistHistory,
} = require("../controllers/approval.controller");

router.get(
  "/obs-pendings",
  authMiddleware,
  isSuperAdmin,
  getAllApprovalPendings
);
router.get("/approve/:id", authMiddleware, isSuperAdmin, approveChange);
router.get("/reject/:id", authMiddleware, isSuperAdmin, rejectChange);
router.get("/history", authMiddleware, isSuperAdmin, worklistHistory);

module.exports = router;
