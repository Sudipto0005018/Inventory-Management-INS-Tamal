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
} = require("../controllers/demand.controller");

router.post("/create", authMiddleware, createDemand);
router.get("/", authMiddleware, getDemands);
router.get("/logs", authMiddleware, getDemandLogs);
router.post("/create-pending-issue", authMiddleware, createPendingIssue);
router.get("/pending-issue", authMiddleware, getPendingIssue);
router.put("/pending-issue/:id", authMiddleware, updatePendingIssue);

module.exports = router;
