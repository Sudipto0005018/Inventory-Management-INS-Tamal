const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");
const {
  createDemand,
  getDemands,
  createPendingIssue,
  getPendingIssue,
} = require("../controllers/demand.controller");

router.post("/create", authMiddleware, createDemand);
router.get("/", authMiddleware, getDemands);
router.post("/create-pending-issue", authMiddleware, createPendingIssue);
router.get("/pending-issue", authMiddleware, getPendingIssue);

module.exports = router;
