const express = require("express");
const router = express.Router();
const {
  createPTSDemand,
  getPTSDemandList,
  updatePTSDemand,
  updatePTSInventory,
  getPTSLogs,
  getPTSItems,
} = require("../controllers/pts.controller");
const { authMiddleware } = require("../middlewares/auth");


// PTS Demand routes
router.post("/pts-demand", authMiddleware, createPTSDemand);
router.get("/pts-demand", authMiddleware, getPTSDemandList);
router.put("/pts-demand", authMiddleware, updatePTSDemand);
router.post("/pts-inventory", authMiddleware, updatePTSInventory);
router.get("/pts-logs", authMiddleware, getPTSLogs);
router.get("/items", authMiddleware, getPTSItems);

module.exports = router;
