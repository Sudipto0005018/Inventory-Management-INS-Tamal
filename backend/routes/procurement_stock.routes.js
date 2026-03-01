const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");
const {
  getProcurementPending,
  getStockUpdatePending,
  updateStock,
  updateProcurement,
  getLogsProcurement,
  getLogsStockUpdate,
  generateQRCode,
} = require("../controllers/procurement_stock.controller");

router.get("/procurement", authMiddleware, getProcurementPending);
router.get("/logsProcure", authMiddleware, getLogsProcurement);
router.get("/stock_in", authMiddleware, getStockUpdatePending);
router.get("/logsStock", authMiddleware, getLogsStockUpdate);
router.put("/stock_in", authMiddleware, updateStock);
router.put("/procurement", authMiddleware, updateProcurement);
router.post("/genarate-qr", generateQRCode);

module.exports = router;
