const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

const {
  createTyLoan,
  getTyLoanList,
  updateTyLoan,
  generateQRCode,
} = require("../controllers/tyLoan.controller");

router.post("/ty", authMiddleware, createTyLoan);
router.get("/list", getTyLoanList);
router.put("/ty-list", authMiddleware, updateTyLoan);
router.post("/genarate-qr", generateQRCode);

module.exports = router;
