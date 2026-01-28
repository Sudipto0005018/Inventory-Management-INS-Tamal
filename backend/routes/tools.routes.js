const express = require("express");
const router = express.Router();

const {
  createTool,
  getTools,
  updateTool,
  deleteTool,
  approveObsAuth,
  getOBSAuthApprovalPending,
  rejectObsAuth,
  getCriticalTools,
} = require("../controllers/tools.controller");
const { authMiddleware, isAdmin, isSuperAdmin } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

router.post("/update/:id", authMiddleware, imageMiddleware, updateTool);
router.post("/", authMiddleware, imageMiddleware, createTool);
router.get("/approval-pending", getOBSAuthApprovalPending);
router.get("/approve/:id", approveObsAuth);
router.get("/reject/:id", rejectObsAuth);
router.get("/", authMiddleware, getTools);
router.get("/critical", authMiddleware, getCriticalTools);
router.delete("/:id", authMiddleware, deleteTool);

module.exports = router;
