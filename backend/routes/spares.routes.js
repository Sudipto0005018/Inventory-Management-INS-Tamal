const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { imageMiddleware } = require("../middlewares/file");

const {
  createSpare,
  getSpares,
  updateSpare,
  deleteSpare,
  approveObsAuth,
  getOBSAuthApprovalPending,
  rejectObsAuth,
  getAllApprovalPendings,
  getCriticalSpares,
  updateSpecialDemand,
  generateQRCode,
} = require("../controllers/spares.controller");

router.post("/update/:id", authMiddleware, imageMiddleware, updateSpare);
router.post("/", authMiddleware, imageMiddleware, createSpare);
router.post("/update-obs", updateSpecialDemand);
router.get("/", authMiddleware, getSpares);
router.get("/critical", authMiddleware, getCriticalSpares);
router.get("/approve/:id", approveObsAuth);
router.get("/reject/:id", rejectObsAuth);
router.get("/approval-pending", getOBSAuthApprovalPending);
router.get("/approval-pending-all", getAllApprovalPendings);
router.delete("/:id", authMiddleware, deleteSpare);
router.post("/genarate-qr", generateQRCode);

module.exports = router;
