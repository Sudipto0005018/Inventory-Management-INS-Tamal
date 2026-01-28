const express = require("express");
const router = express.Router();

const {
    addSupplier,
    getSupplierList,
    getSuppliers,
    updateSupplier,
    deleteSupplier,
} = require("../controllers/supplier.controller");

router.post("/", addSupplier);
router.get("/list", getSupplierList);
router.get("/all", getSuppliers);
router.post("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
