const express = require("express");
const router = express.Router();

const {
  addSupplier,
  getSupplierList,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
} = require("../controllers/supplier.controller");

router.put("/:id", updateSupplier);
router.post("/", addSupplier);
router.get("/list", getSupplierList);
router.get("/all", getSuppliers);
router.get("/:id", getSupplierById);
router.delete("/:id", deleteSupplier);

module.exports = router;
