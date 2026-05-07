const express = require("express");
const router = express.Router();

const {
  createStoredemDemand,
  getStoredemDemandList,
  updateStoredemDemand,
  updateStoredemInventory,
  getStoredemLogs,
  getStoredemItems,
} = require("../controllers/storedem.controller");
const { authMiddleware } = require("../middlewares/auth");

// STOREDEM/OPDEM routes
router.post("/storedem-demand", authMiddleware, createStoredemDemand);
router.get("/storedem-demand", authMiddleware, getStoredemDemandList);
router.put("/storedem-demand", authMiddleware, updateStoredemDemand);
router.post("/storedem-inventory", authMiddleware, updateStoredemInventory);
router.get("/storedem-logs", authMiddleware, getStoredemLogs);
router.get("/items", authMiddleware, getStoredemItems);

module.exports = router;
