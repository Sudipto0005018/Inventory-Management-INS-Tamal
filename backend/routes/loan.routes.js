const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");

const {
    getPendingTYLoans,
    receiveTYLoan,
    getTYLoanReceiveHistory,
    getCompletedTYLoans,
    getPendingTempLoans,
    receiveTempLoan,
    getTempLoanReceiveHistory,
    getCompletedTempLoans,
} = require("../controllers/loan.controller");

router.get("/ty-loans", authMiddleware, getPendingTYLoans);
router.post("/ty-loans-receive", authMiddleware, receiveTYLoan);
router.get("/ty-loans-history/:id", authMiddleware, getTYLoanReceiveHistory);
router.get("/ty-loans-completed", authMiddleware, getCompletedTYLoans);
router.get("/temp-loans", authMiddleware, getPendingTempLoans);
router.post("/temp-loans-receive", authMiddleware, receiveTempLoan);
router.get("/temp-loans-history/:id", authMiddleware, getTempLoanReceiveHistory);
router.get("/temp-loans-completed", authMiddleware, getCompletedTempLoans);

module.exports = router;
