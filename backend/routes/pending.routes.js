const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");

const {
    getPendingList,
    getNonPendingList,
    issueCategory,
    issueTemporaryProduct,
    servayProduct,
    demandProduct,
    nacProduct,
    printQR,
    pendingIssue,
    addQRCodeResults,
    issueLoanProduct,
    issuePermanentProduct,
    getSurveyedProducts,
    stockingProduct,
    addInInventory,
    getCompletedPermanentIssues,
} = require("../controllers/pending.controller");

router.get("/", authMiddleware, getPendingList);
router.get("/non-pending", authMiddleware, getNonPendingList);
router.post("/issue-category", authMiddleware, issueCategory);
router.post("/issue", authMiddleware, issueTemporaryProduct);
router.post("/servay", authMiddleware, servayProduct);
router.post("/demand", authMiddleware, demandProduct);
router.post("/nac", authMiddleware, nacProduct);
router.post("/stocking", authMiddleware, stockingProduct);
router.post("/print", authMiddleware, printQR);
router.post("/pending-issue", authMiddleware, pendingIssue);
router.post("/add-qrs", authMiddleware, addQRCodeResults);
router.post("/issue-loan", authMiddleware, issueLoanProduct);
router.post("/issue-permanent", authMiddleware, issuePermanentProduct);
router.get("/surveyed", authMiddleware, getSurveyedProducts);
router.post("/inventory", authMiddleware, addInInventory);
router.get("/completed-permanent-issues", authMiddleware, getCompletedPermanentIssues);

module.exports = router;
