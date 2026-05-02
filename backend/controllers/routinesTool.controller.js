// controllers/routinesTool.controller.js
const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");


// const createRoutine = async (req, res) => {
//   const { name, description, equipment_system, tool_ids = [] } = req.body;
//   const department = req.department;

//   try {
//     if (!name || !equipment_system) {
//       return res
//         .status(400)
//         .json(
//           new ApiErrorResponse(
//             400,
//             {},
//             "Routine name and equipment system are required",
//           ),
//         );
//     }

//     // Check if routine already exists for this equipment
//     const [existing] = await pool.query(
//       `SELECT id FROM routines_check WHERE name = ? AND equipment_system = ? AND department_id = ?`,
//       [name, equipment_system, department.id],
//     );

//     if (existing.length > 0) {
//       return res
//         .status(400)
//         .json(
//           new ApiErrorResponse(
//             400,
//             {},
//             "Routine with this name already exists for this equipment",
//           ),
//         );
//     }

//     // Insert routine into routines_check table
//     const [result] = await pool.query(
//       `INSERT INTO routines_check (name, description, equipment_system, department_id, created_by)
//        VALUES (?, ?, ?, ?, ?)`,
//       [
//         name,
//         description || null,
//         equipment_system,
//         department.id,
//         req.user?.id || null,
//       ],
//     );

//     const routineId = result.insertId;

//     // Insert tools into routine_tools table
//     if (tool_ids && tool_ids.length > 0) {
//       const toolValues = tool_ids.map((toolId) => [routineId, toolId]);
//       await pool.query(
//         `INSERT INTO routine_tools (routine_id, tool_id) VALUES ?`,
//         [toolValues],
//       );
//     }

//     const [routine] = await pool.query(
//       `SELECT * FROM routines_check WHERE id = ?`,
//       [routineId],
//     );

//     res.status(201).json(
//       new ApiResponse(
//         201,
//         {
//           ...routine[0],
//           tool_ids,
//         },
//         "Tool routine created successfully",
//       ),
//     );
//   } catch (error) {
//     console.error("Error creating tool routine:", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// };


const createRoutine = async (req, res) => {
  const { name, description, equipment_system, tools = [] } = req.body;
  const department = req.department;

  try {
    if (!name || !equipment_system) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(
            400,
            {},
            "Routine name and equipment system are required",
          ),
        );
    }

    const [existing] = await pool.query(
      `SELECT id FROM routines_check WHERE name = ? AND equipment_system = ? AND department_id = ?`,
      [name, equipment_system, department.id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json(
          new ApiErrorResponse(
            400,
            {},
            "Routine with this name already exists for this equipment",
          ),
        );
    }

    const [result] = await pool.query(
      `INSERT INTO routines_check (name, description, equipment_system, department_id, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        equipment_system,
        department.id,
        req.user?.id || null,
      ],
    );

    const routineId = result.insertId;

    // Insert tools with quantities
    if (tools && tools.length > 0) {
      const toolValues = tools.map(({ id, quantity_required = 1 }) => [
        routineId,
        id,
        quantity_required,
      ]);
      await pool.query(
        `INSERT INTO routine_tools (routine_id, tool_id, quantity_required) VALUES ?`,
        [toolValues],
      );
    }

    const [routine] = await pool.query(
      `SELECT * FROM routines_check WHERE id = ?`,
      [routineId],
    );

    res.status(201).json(
      new ApiResponse(
        201,
        {
          ...routine[0],
          tools,
        },
        "Tool routine created successfully",
      ),
    );
  } catch (error) {
    console.error("Error creating tool routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

const getRoutinesByEquipment = async (req, res) => {
  const { equipmentName } = req.params;
  const department = req.department;

  try {
    const [routines] = await pool.query(
      `SELECT r.*, 
        COUNT(rt.tool_id) as total_tools
       FROM routines_check r
       LEFT JOIN routine_tools rt ON r.id = rt.routine_id
       WHERE r.equipment_system = ? AND r.department_id = ?
       GROUP BY r.id
       ORDER BY r.name ASC`,
      [equipmentName, department.id],
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, routines, "Tool routines retrieved successfully"),
      );
  } catch (error) {
    console.error("Error fetching tool routines:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

// const getRoutineTools = async (req, res) => {
//   const { routineId } = req.params;
//   const department = req.department;

//   try {
//     // Verify routine exists in routines_check table
//     const [routineCheck] = await pool.query(
//       `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
//       [routineId, department.id],
//     );

//     if (routineCheck.length === 0) {
//       return res
//         .status(404)
//         .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
//     }

//     // Get tools assigned to this routine
//     const [tools] = await pool.query(
//       `SELECT t.*
//        FROM tools t
//        INNER JOIN routine_tools rt ON t.id = rt.tool_id
//        WHERE rt.routine_id = ?
//        ORDER BY t.description ASC`,
//       [routineId],
//     );

//     res
//       .status(200)
//       .json(
//         new ApiResponse(200, tools, "Routine tools retrieved successfully"),
//       );
//   } catch (error) {
//     console.error("Error fetching routine tools:", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// };


const getRoutineTools = async (req, res) => {
  const { routineId } = req.params;
  const department = req.department;

  try {
    const [routineCheck] = await pool.query(
      `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routineCheck.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
    }

    const [tools] = await pool.query(
      `SELECT t.*, rt.quantity_required 
       FROM tools t
       INNER JOIN routine_tools rt ON t.id = rt.tool_id
       WHERE rt.routine_id = ?
       ORDER BY t.description ASC`,
      [routineId],
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, tools, "Routine tools retrieved successfully"),
      );
  } catch (error) {
    console.error("Error fetching routine tools:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

// const updateRoutine = async (req, res) => {
//   const { routineId } = req.params;
//   const { name, description, equipment_system, tool_ids = [] } = req.body;
//   const department = req.department;

//   try {
//     // Verify routine exists in routines_check table
//     const [routine] = await pool.query(
//       `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
//       [routineId, department.id],
//     );

//     if (routine.length === 0) {
//       return res
//         .status(404)
//         .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
//     }

//     // Update routine details
//     await pool.query(
//       `UPDATE routines_check SET name = ?, description = ?, equipment_system = ?, updated_at = NOW() WHERE id = ?`,
//       [name, description || null, equipment_system, routineId],
//     );

//     // Update tools - delete existing and insert new
//     await pool.query(`DELETE FROM routine_tools WHERE routine_id = ?`, [
//       routineId,
//     ]);

//     if (tool_ids && tool_ids.length > 0) {
//       const toolValues = tool_ids.map((toolId) => [routineId, toolId]);
//       await pool.query(
//         `INSERT INTO routine_tools (routine_id, tool_id) VALUES ?`,
//         [toolValues],
//       );
//     }

//     res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { id: routineId, name, description, equipment_system, tool_ids },
//           "Tool routine updated successfully",
//         ),
//       );
//   } catch (error) {
//     console.error("Error updating tool routine:", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// };


const updateRoutine = async (req, res) => {
  const { routineId } = req.params;
  const { name, description, equipment_system, tools = [] } = req.body;
  const department = req.department;

  try {
    const [routine] = await pool.query(
      `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
    }

    await pool.query(
      `UPDATE routines_check SET name = ?, description = ?, equipment_system = ?, updated_at = NOW() WHERE id = ?`,
      [name, description || null, equipment_system, routineId],
    );

    // Update tools - delete existing and insert new
    await pool.query(`DELETE FROM routine_tools WHERE routine_id = ?`, [
      routineId,
    ]);

    if (tools && tools.length > 0) {
      const toolValues = tools.map(({ id, quantity_required = 1 }) => [
        routineId,
        id,
        quantity_required,
      ]);
      await pool.query(
        `INSERT INTO routine_tools (routine_id, tool_id, quantity_required) VALUES ?`,
        [toolValues],
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { id: routineId, name, description, equipment_system, tools },
          "Tool routine updated successfully",
        ),
      );
  } catch (error) {
    console.error("Error updating tool routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

const deleteRoutine = async (req, res) => {
  const { routineId } = req.params;
  const department = req.department;

  try {
    // Verify routine exists in routines_check table
    const [routine] = await pool.query(
      `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
    }

    // Delete routine (routine_tools will be deleted automatically due to CASCADE)
    await pool.query(`DELETE FROM routines_check WHERE id = ?`, [routineId]);

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Tool routine deleted successfully"));
  } catch (error) {
    console.error("Error deleting tool routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};


const addToolsToRoutine = async (req, res) => {
  const { routineId } = req.params;
  const { tool_ids = [] } = req.body;
  const department = req.department;

  try {
    // Verify routine exists in routines_check table
    const [routine] = await pool.query(
      `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
    }

    // Insert new tools (avoid duplicates)
    const toolValues = tool_ids.map((toolId) => [routineId, toolId]);
    await pool.query(
      `INSERT IGNORE INTO routine_tools (routine_id, tool_id) VALUES ?`,
      [toolValues],
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { routineId, added_tools: tool_ids },
          "Tools added to routine successfully",
        ),
      );
  } catch (error) {
    console.error("Error adding tools to routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};


const removeToolFromRoutine = async (req, res) => {
  const { routineId, toolId } = req.params;
  const department = req.department;

  try {
    // Verify routine exists in routines_check table
    const [routine] = await pool.query(
      `SELECT id FROM routines_check WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Tool routine not found"));
    }

    // Remove tool from routine
    await pool.query(
      `DELETE FROM routine_tools WHERE routine_id = ? AND tool_id = ?`,
      [routineId, toolId],
    );

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Tool removed from routine successfully"));
  } catch (error) {
    console.error("Error removing tool from routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};


const getAllRoutines = async (req, res) => {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const department = req.department;

  try {
    // Get total count
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM routines_check WHERE department_id = ?`,
      [department.id],
    );
    const totalRoutines = totalCount[0].count;

    // Get paginated routines with tool counts
    const [routines] = await pool.query(
      `SELECT r.*, 
        COUNT(rt.tool_id) as total_tools,
        GROUP_CONCAT(t.description SEPARATOR '|') as tool_names
       FROM routines_check r
       LEFT JOIN routine_tools rt ON r.id = rt.routine_id
       LEFT JOIN tools t ON rt.tool_id = t.id
       WHERE r.department_id = ?
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [department.id, limit, offset],
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: routines,
          totalItems: totalRoutines,
          totalPages: Math.ceil(totalRoutines / limit),
          currentPage: page,
        },
        "Tool routines retrieved successfully",
      ),
    );
  } catch (error) {
    console.error("Error fetching all tool routines:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

module.exports = {
  createRoutine,
  getRoutinesByEquipment,
  getRoutineTools,
  updateRoutine,
  deleteRoutine,
  addToolsToRoutine,
  removeToolFromRoutine,
  getAllRoutines,
};
