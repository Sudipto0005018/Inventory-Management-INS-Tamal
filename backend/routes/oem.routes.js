const express = require("express");
const router = express.Router();

const {
  addOem,
  getOEMList,
  getOEMS,
  updateOem,
  deleteOem,
  getOemById,
  getAllOEMsWithContacts,
  getOEMWithContacts,
  getOEMContactPersons,
} = require("../controllers/oem.controller");

router.post("/", addOem);
router.get("/list", getOEMList);
router.get("/all", getOEMS);
router.get("/:id", getOemById);
router.put("/:id", updateOem);
router.delete("/:id", deleteOem);
router.get("/with-contacts", getAllOEMsWithContacts);
router.get("/:id/with-contacts", getOEMWithContacts);
router.get("/:id/contact-persons", getOEMContactPersons);

module.exports = router;
