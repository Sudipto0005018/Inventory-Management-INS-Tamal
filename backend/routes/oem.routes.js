const express = require("express");
const router = express.Router();

const {
  addOem,
  getOEMList,
  getOEMS,
  updateOem,
  deleteOem,
  getOemById,
} = require("../controllers/oem.controller");

router.post("/", addOem); 
router.get("/list", getOEMList);
router.get("/all", getOEMS);
router.get("/:id", getOemById);
router.put("/:id", updateOem);
router.delete("/:id", deleteOem);

module.exports = router;
