const express = require("express");
const router = express.Router();

const {
    getConnectedDevices,
    syncDevice,
    updateDevice,
    getDbUsbHandhelds,
} = require("../controllers/sync.controller");

router.get("/devices", getConnectedDevices);
router.get("/sync/:id", syncDevice);
router.post("/update", updateDevice);
router.get("/db-devices", getDbUsbHandhelds);

module.exports = router;
