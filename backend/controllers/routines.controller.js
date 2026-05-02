// controllers/routines.controller.js
const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");


// const createRoutine = async (req, res) => {
//   const { name, equipment_system, spare_ids = [] } = req.body;
//   const department = req.department;

//   try {
//     // Validate required fields
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
//       `SELECT id FROM routines WHERE name = ? AND equipment_system = ? AND department_id = ?`,
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

//     // Insert routine
//     const [result] = await pool.query(
//       `INSERT INTO routines (name, equipment_system, department_id, created_by) 
//        VALUES (?, ?, ?, ?)`,
//       [name, equipment_system, department.id, req.user?.id || null],
//     );

//     const routineId = result.insertId;

//     // Insert spares if any
//     if (spare_ids && spare_ids.length > 0) {
//       const spareValues = spare_ids.map((spareId) => [routineId, spareId]);
//       await pool.query(
//         `INSERT INTO routine_spares (routine_id, spare_id) VALUES ?`,
//         [spareValues],
//       );
//     }

//     // Fetch the created routine with spares
//     const [routine] = await pool.query(`SELECT * FROM routines WHERE id = ?`, [
//       routineId,
//     ]);

//     res.status(201).json(
//       new ApiResponse(
//         201,
//         {
//           ...routine[0],
//           spare_ids,
//         },
//         "Routine created successfully",
//       ),
//     );
//   } catch (error) {
//     console.error("Error creating routine:", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// };

const createRoutine = async (req, res) => {
  const { name, description, equipment_system, spares = [] } = req.body;
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

    // Check if routine already exists
    const [existing] = await pool.query(
      `SELECT id FROM routines WHERE name = ? AND equipment_system = ? AND department_id = ?`,
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

    // Insert routine
    const [result] = await pool.query(
      `INSERT INTO routines (name, description, equipment_system, department_id, created_by) 
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

    // Insert spares with quantities
    if (spares && spares.length > 0) {
      const spareValues = spares.map(({ id, quantity_required = 1 }) => [
        routineId,
        id,
        quantity_required,
      ]);
      await pool.query(
        `INSERT INTO routine_spares (routine_id, spare_id, quantity_required) VALUES ?`,
        [spareValues],
      );
    }

    const [routine] = await pool.query(`SELECT * FROM routines WHERE id = ?`, [
      routineId,
    ]);

    res.status(201).json(
      new ApiResponse(
        201,
        {
          ...routine[0],
          spares,
        },
        "Routine created successfully",
      ),
    );
  } catch (error) {
    console.error("Error creating routine:", error);
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
        COUNT(rs.spare_id) as total_spares
       FROM routines r
       LEFT JOIN routine_spares rs ON r.id = rs.routine_id
       WHERE r.equipment_system = ? AND r.department_id = ?
       GROUP BY r.id
       ORDER BY r.name ASC`,
      [equipmentName, department.id],
    );

    res
      .status(200)
      .json(new ApiResponse(200, routines, "Routines retrieved successfully"));
  } catch (error) {
    console.error("Error fetching routines:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};


// const getRoutineSpares = async (req, res) => {
//   const { routineId } = req.params;
//   const department = req.department;

//   try {
//     // Verify routine belongs to department
//     const [routineCheck] = await pool.query(
//       `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
//       [routineId, department.id],
//     );

//     if (routineCheck.length === 0) {
//       return res
//         .status(404)
//         .json(new ApiErrorResponse(404, {}, "Routine not found"));
//     }

//     // Get spares assigned to routine
//     const [spares] = await pool.query(
//       `SELECT s.*
//        FROM spares s
//        INNER JOIN routine_spares rs ON s.id = rs.spare_id
//        WHERE rs.routine_id = ?
//        ORDER BY s.description ASC`,
//       [routineId],
//     );

//     res
//       .status(200)
//       .json(
//         new ApiResponse(200, spares, "Routine spares retrieved successfully"),
//       );
//   } catch (error) {
//     console.error("Error fetching routine spares:", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// };

const getRoutineSpares = async (req, res) => {
  const { routineId } = req.params;
  const department = req.department;

  try {
    const [routineCheck] = await pool.query(
      `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routineCheck.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Routine not found"));
    }

    const [spares] = await pool.query(
      `SELECT s.*, rs.quantity_required 
       FROM spares s
       INNER JOIN routine_spares rs ON s.id = rs.spare_id
       WHERE rs.routine_id = ?
       ORDER BY s.description ASC`,
      [routineId],
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, spares, "Routine spares retrieved successfully"),
      );
  } catch (error) {
    console.error("Error fetching routine spares:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

// const updateRoutine = async (req, res) => {
//   const { routineId } = req.params;
//   const { name, equipment_system, spare_ids = [] } = req.body;
//   const department = req.department;

//   try {
//     // Verify routine exists and belongs to department
//     const [routine] = await pool.query(
//       `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
//       [routineId, department.id],
//     );

//     if (routine.length === 0) {
//       return res
//         .status(404)
//         .json(new ApiErrorResponse(404, {}, "Routine not found"));
//     }

//     // Update routine details
//     await pool.query(
//       `UPDATE routines SET name = ?, equipment_system = ?, updated_at = NOW() WHERE id = ?`,
//       [name, equipment_system, routineId],
//     );

//     // Update spares - delete existing and insert new
//     await pool.query(`DELETE FROM routine_spares WHERE routine_id = ?`, [
//       routineId,
//     ]);

//     if (spare_ids && spare_ids.length > 0) {
//       const spareValues = spare_ids.map((spareId) => [routineId, spareId]);
//       await pool.query(
//         `INSERT INTO routine_spares (routine_id, spare_id) VALUES ?`,
//         [spareValues],
//       );
//     }

//     res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { id: routineId, name, equipment_system, spare_ids },
//           "Routine updated successfully",
//         ),
//       );
//   } catch (error) {
//     console.error("Error updating routine:", error);
//     res
//       .status(500)
//       .json(new ApiErrorResponse(500, {}, "Internal server error"));
//   }
// };

const updateRoutine = async (req, res) => {
  const { routineId } = req.params;
  const { name, description, equipment_system, spares = [] } = req.body;
  const department = req.department;

  try {
    const [routine] = await pool.query(
      `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Routine not found"));
    }

    await pool.query(
      `UPDATE routines SET name = ?, description = ?, equipment_system = ?, updated_at = NOW() WHERE id = ?`,
      [name, description || null, equipment_system, routineId],
    );

    // Update spares - delete existing and insert new
    await pool.query(`DELETE FROM routine_spares WHERE routine_id = ?`, [
      routineId,
    ]);

    if (spares && spares.length > 0) {
      const spareValues = spares.map(({ id, quantity_required = 1 }) => [
        routineId,
        id,
        quantity_required,
      ]);
      await pool.query(
        `INSERT INTO routine_spares (routine_id, spare_id, quantity_required) VALUES ?`,
        [spareValues],
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { id: routineId, name, equipment_system, spares },
          "Routine updated successfully",
        ),
      );
  } catch (error) {
    console.error("Error updating routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

const deleteRoutine = async (req, res) => {
  const { routineId } = req.params;
  const department = req.department;

  try {
    // Verify routine exists and belongs to department
    const [routine] = await pool.query(
      `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Routine not found"));
    }

    // Delete routine (cascade will delete routine_spares)
    await pool.query(`DELETE FROM routines WHERE id = ?`, [routineId]);

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Routine deleted successfully"));
  } catch (error) {
    console.error("Error deleting routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};


const addSparesToRoutine = async (req, res) => {
  const { routineId } = req.params;
  const { spare_ids = [] } = req.body;
  const department = req.department;

  try {
    // Verify routine exists
    const [routine] = await pool.query(
      `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Routine not found"));
    }

    // Insert new spares (avoid duplicates)
    const spareValues = spare_ids.map((spareId) => [routineId, spareId]);
    await pool.query(
      `INSERT IGNORE INTO routine_spares (routine_id, spare_id) VALUES ?`,
      [spareValues],
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { routineId, added_spares: spare_ids },
          "Spares added to routine successfully",
        ),
      );
  } catch (error) {
    console.error("Error adding spares to routine:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};


const removeSpareFromRoutine = async (req, res) => {
  const { routineId, spareId } = req.params;
  const department = req.department;

  try {
    // Verify routine exists
    const [routine] = await pool.query(
      `SELECT id FROM routines WHERE id = ? AND department_id = ?`,
      [routineId, department.id],
    );

    if (routine.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Routine not found"));
    }

    // Remove spare from routine
    await pool.query(
      `DELETE FROM routine_spares WHERE routine_id = ? AND spare_id = ?`,
      [routineId, spareId],
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Spare removed from routine successfully"),
      );
  } catch (error) {
    console.error("Error removing spare from routine:", error);
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
      `SELECT COUNT(*) as count FROM routines WHERE department_id = ?`,
      [department.id],
    );
    const totalRoutines = totalCount[0].count;

    // Get paginated routines with spare counts
    const [routines] = await pool.query(
      `SELECT r.*, 
        COUNT(rs.spare_id) as total_spares,
        GROUP_CONCAT(s.description SEPARATOR '|') as spare_names
       FROM routines r
       LEFT JOIN routine_spares rs ON r.id = rs.routine_id
       LEFT JOIN spares s ON rs.spare_id = s.id
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
        "Routines retrieved successfully",
      ),
    );
  } catch (error) {
    console.error("Error fetching all routines:", error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
};

module.exports = {
  createRoutine,
  getRoutinesByEquipment,
  getRoutineSpares,
  updateRoutine,
  deleteRoutine,
  addSparesToRoutine,
  removeSpareFromRoutine,
  getAllRoutines,
};
