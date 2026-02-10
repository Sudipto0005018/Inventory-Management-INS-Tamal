const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");
const {
  updatePendingIssue,
  getPendingIssue,
} = require("../controllers/issue.controller");

router.put("/pending-issue/:id", authMiddleware, updatePendingIssue);
router.get("/pending-issue", authMiddleware, getPendingIssue);

module.exports = router;
