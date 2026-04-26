// routes/routinesTool.routes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const {
  createRoutine,
  getRoutinesByEquipment,
  getRoutineTools,
  updateRoutine,
  deleteRoutine,
  addToolsToRoutine,
  removeToolFromRoutine,
  getAllRoutines,
} = require("../controllers/routinesTool.controller");

// Routes for TOOLS routines
router.post("/", authMiddleware, createRoutine);
router.get("/equipment/:equipmentName", authMiddleware, getRoutinesByEquipment);
router.get("/:routineId/tools", authMiddleware, getRoutineTools);
router.put("/:routineId", authMiddleware, updateRoutine);
router.delete("/:routineId", authMiddleware, deleteRoutine);
router.post("/:routineId/tools", authMiddleware, addToolsToRoutine);
router.delete(
  "/:routineId/tools/:toolId",
  authMiddleware,
  removeToolFromRoutine,
);
router.get("/all", authMiddleware, getAllRoutines);

module.exports = router;
