const express = require("express");
const router = express.Router();

const {
  createSurvey,
  getSurveys,
  createDemand,
} = require("../controllers/survey.controller");
const { authMiddleware } = require("../middlewares/auth");

router.post("/create", authMiddleware, createSurvey);
router.get("/", getSurveys);
router.post("/create-demand", authMiddleware, createDemand);

module.exports = router;
