const express = require("express");
const router = express.Router();

const {
    addOem,
    getOEMList,
    getOEMS,
    updateOem,
    deleteOem,
} = require("../controllers/oem.controller");

router.post("/", addOem);
router.get("/list", getOEMList);
router.get("/all", getOEMS);
router.post("/:id", updateOem);
router.delete("/:id", deleteOem);

module.exports = router;
