const express = require("express");
const router = express.Router();

const {
  addConfig,
  getLocationStorage,
  getIssueTo,
  getConcurredBy,
  getUserByServiceNo,
  deleteConfig,
  getPersonnel,
  getSurveyReason,
  getCategory,
  getDenos,
  getEquipment
} = require("../controllers/config.controller");

router.post("/add", addConfig);
router.get("/location-storage", getLocationStorage);
router.get("/issue", getIssueTo);
router.get("/concurred_by", getConcurredBy);
router.get("/service-no/:service_no", getUserByServiceNo);
router.delete("/:id", deleteConfig);
router.get("/personnel", getPersonnel);
router.get("/survey", getSurveyReason);
router.get("/category", getCategory);
router.get("/denos", getDenos);
router.get("/equipment_system", getEquipment);

module.exports = router;
