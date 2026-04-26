const express = require("express");
const router = express.Router();

const {
  createSurvey,
  getSurveys,
  getLogSurveys,
  revertSurvey,
  manualAddSurvey,
  getSurveyItems,
} = require("../controllers/survey.controller");
const { authMiddleware } = require("../middlewares/auth");

router.post("/create", authMiddleware, createSurvey);
router.get("/", authMiddleware, getSurveys);
router.get("/logs", authMiddleware, getLogSurveys);
router.post("/reverse", authMiddleware, revertSurvey);
router.post("/manual-add", authMiddleware, manualAddSurvey);
router.get("/items", authMiddleware, getSurveyItems);
module.exports = router;
