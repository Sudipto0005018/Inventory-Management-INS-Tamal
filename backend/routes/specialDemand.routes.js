const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

const {
  createSpecialDemand,
  getSpecialDemandList,
  updateSpacialDemand,
} = require("../controllers/specialDemand.controller");

router.post("/special", authMiddleware, createSpecialDemand);
router.get("/special-demand", getSpecialDemandList);
router.put("/special-demand", authMiddleware, updateSpacialDemand);

module.exports = router;
