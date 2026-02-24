const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

const {
  createDocCorner,
  getDocCorner,
  updateDocCorner,
  getDocIssue,
  createDocIssue,
  updateDocIssue,
  generateQRCode,
  getDocLogs,
  getLowStockDocuments,
  getDocOverdue,
} = require("../controllers/docCorner.controller");

router.post("/update/:id", authMiddleware, imageMiddleware, updateDocCorner);
router.post("/", authMiddleware, imageMiddleware, createDocCorner);
router.get("/", authMiddleware, getDocCorner);
router.post("/issue", authMiddleware, createDocIssue);
router.get("/list", getDocIssue);
router.get("/logs", getDocLogs);
router.put("/doc-list", authMiddleware, updateDocIssue);
router.post("/genarate-qr", generateQRCode);
router.get("/low-stock", getLowStockDocuments);
router.get("/overdue", getDocOverdue);

module.exports = router;
