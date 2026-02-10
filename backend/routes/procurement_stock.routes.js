const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");
const {
  getProcurementPending,
  getStockUpdatePending,
  updateStock,
  updateProcurement,
} = require("../controllers/procurement_stock.controller");

router.get("/procurement", authMiddleware, getProcurementPending);
router.get("/stock_in", authMiddleware, getStockUpdatePending);
router.put("/stock_in", authMiddleware, updateStock);
router.put("/procurement", authMiddleware, updateProcurement);

module.exports = router;
