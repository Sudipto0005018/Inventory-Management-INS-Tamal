const express = require("express");
const router = express.Router();

const {
  addConfig,
  getLocationStorage,
  getIssueTo,
  getConcurredBy,
  getUserByServiceNo,
  deleteConfig,
} = require("../controllers/config.controller");

router.post("/add", addConfig);
router.get("/location-storage", getLocationStorage);
router.get("/issue", getIssueTo); 
router.get("/concurred_by", getConcurredBy);
router.get("/service-no/:service_no", getUserByServiceNo);
router.delete("/:id", deleteConfig);

module.exports = router;
