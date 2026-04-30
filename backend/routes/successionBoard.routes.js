// routes/successionBoard.routes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const {
  getSuccessionBoard,
  addSuccession,
  updateSuccession,
  deleteSuccession,
} = require("../controllers/successionBoard.controller");

router.get("/", authMiddleware, getSuccessionBoard);
router.post("/", authMiddleware, addSuccession);
router.put("/:id", authMiddleware, updateSuccession);
router.delete("/:id", authMiddleware, deleteSuccession);

module.exports = router;
