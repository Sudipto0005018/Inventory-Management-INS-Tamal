// routes/nominalRoll.routes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const {
  getPresentPersonnel,
  getExPersonnel,
  addPersonnel,
  updatePersonnel,
  transferPersonnel,
  deletePersonnel,
} = require("../controllers/nominalRoll.controller");

router.get("/present", authMiddleware, getPresentPersonnel);
router.get("/ex", authMiddleware, getExPersonnel);
router.post("/", authMiddleware, addPersonnel);
router.put("/:id", authMiddleware, updatePersonnel);
router.post("/:id/transfer", authMiddleware, transferPersonnel);
router.delete("/:id", authMiddleware, deletePersonnel);

module.exports = router;
