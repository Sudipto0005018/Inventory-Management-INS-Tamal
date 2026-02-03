const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");

const {
  updateStock,
  generateQRCode,
} = require("../controllers/stockUpdate.controller");

// /stock/stock-update
router.put("/stock-update", authMiddleware, updateStock);
router.post("/genarate-qr", generateQRCode);

module.exports = router;
