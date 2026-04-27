const express = require("express");
const router = express.Router();

const {
  addSupplier,
  getSupplierList,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
  getAllSuppliersWithContacts,
  getSupplierWithContacts,
  getSupplierContactPersons,
} = require("../controllers/supplier.controller");

router.put("/:id", updateSupplier);
router.post("/", addSupplier);
router.get("/list", getSupplierList);
router.get("/all", getSuppliers);
router.get("/:id", getSupplierById);
router.delete("/:id", deleteSupplier);
router.get("/with-contacts", getAllSuppliersWithContacts);
router.get("/:id/with-contacts", getSupplierWithContacts);
router.get("/:id/contact-persons", getSupplierContactPersons);

module.exports = router;
