// routes/backup.routes.js
const express = require("express");
const router = express.Router();
const { triggerBackup } = require("../controllers/backup.controller");

// Optional: protect this route (VERY IMPORTANT)
router.get("/run-backup", triggerBackup);

module.exports = router;
