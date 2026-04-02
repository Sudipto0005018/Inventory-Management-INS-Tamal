const express = require("express");
const router = express.Router();

const {
  getConnectedDevices,
  syncDevice,
  updateDevice,
  getDbUsbHandhelds,
  adbSync,
  manualAdbSync,
} = require("../controllers/sync.controller");

router.get("/devices", getConnectedDevices);
router.get("/sync/:id", syncDevice);
router.post("/update", updateDevice);
router.get("/db-devices", getDbUsbHandhelds);
router.post("/adb-sync/:deviceId", adbSync);
router.post("/adb-sync/:deviceId", manualAdbSync);

module.exports = router;
