const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

const {
  createSpecialDemand,
  getSpecialDemandList,
  updateSpecialDemand,
  getLogsSpecialDemand,
  createD787Original,
} = require("../controllers/specialDemand.controller");

router.post("/special", authMiddleware, createSpecialDemand);
router.get("/special-demand", getSpecialDemandList);
router.get("/logs", getLogsSpecialDemand);
router.put("/special-demand", authMiddleware, updateSpecialDemand);
router.post("/d787", authMiddleware, createD787Original);

module.exports = router;
