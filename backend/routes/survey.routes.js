const express = require("express");
const router = express.Router();

const {
  createSurvey,
  getSurveys,
} = require("../controllers/survey.controller");
const { authMiddleware } = require("../middlewares/auth");

router.post("/create", authMiddleware, createSurvey);
router.get("/", authMiddleware, getSurveys);

module.exports = router;
