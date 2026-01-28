const express = require("express");
const router = express.Router();

const {
    createDepartment,
    getDepartments,
    updateDepartment,
    deleteDepartment,
} = require("../controllers/departments.controller");

router.post("/", createDepartment);
router.get("/", getDepartments);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;
