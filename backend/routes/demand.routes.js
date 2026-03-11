const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");
const {
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
} = require("../controllers/demand.controller");

router.post("/create", authMiddleware, createDemand);
router.get("/", authMiddleware, getDemands);
router.get("/logs", authMiddleware, getDemandLogs);
router.post("/create-pending-issue", authMiddleware, createPendingIssue);
router.get("/pending-issue", authMiddleware, getPendingIssue);
router.put("/pending-issue/:id", authMiddleware, updatePendingIssue);
router.post("/reverse", authMiddleware, revertDemand);
router.post("/reverse", authMiddleware, revertPendingIssue);
router.post("/repair-stock", authMiddleware, createRepairStock);
router.post("/manual-add", authMiddleware, manualAddDemand);

module.exports = router;
