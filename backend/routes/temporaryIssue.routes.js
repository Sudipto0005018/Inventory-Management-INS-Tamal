const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

const {
  createTemporaryIssue,
  getTemporaryIssueList,
  updateTemporaryIssue,
} = require("../controllers/temporaryIssue.controller");

router.post("/temporary", authMiddleware, createTemporaryIssue);
router.get("/issue", getTemporaryIssueList);
router.put("/issue", authMiddleware, updateTemporaryIssue); 

module.exports = router;
