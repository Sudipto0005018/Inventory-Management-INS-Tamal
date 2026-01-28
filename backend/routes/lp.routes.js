const express = require("express");
const router = express.Router();

const { createLP, getLPs, updateLP, deleteLP } = require("../controllers/lp.controller");
const { authMiddleware, isSuperAdmin } = require("../middlewares/auth");

router.post("/", authMiddleware, createLP);
router.get("/", authMiddleware, getLPs);
router.put("/:id", authMiddleware, updateLP);
router.delete("/:id", authMiddleware, deleteLP);

module.exports = router;
