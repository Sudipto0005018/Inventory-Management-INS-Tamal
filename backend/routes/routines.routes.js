// routines.routes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const {
  createRoutine,
  getRoutinesByEquipment,
  getRoutineSpares,
  updateRoutine,
  deleteRoutine,
  addSparesToRoutine,
  removeSpareFromRoutine,
  getAllRoutines,
} = require("../controllers/routines.controller");

// Routes
router.post("/", authMiddleware, createRoutine);
router.get("/equipment/:equipmentName", authMiddleware, getRoutinesByEquipment);
router.get("/:routineId/spares", authMiddleware, getRoutineSpares);
router.put("/:routineId", authMiddleware, updateRoutine);
router.delete("/:routineId", authMiddleware, deleteRoutine);
router.post("/:routineId/spares", authMiddleware, addSparesToRoutine);
router.delete(
  "/:routineId/spares/:spareId",
  authMiddleware,
  removeSpareFromRoutine,
);
router.get("/all", authMiddleware, getAllRoutines);

module.exports = router;
