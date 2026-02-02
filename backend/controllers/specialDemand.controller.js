const pool = require("../utils/dbConnect");
const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");

async function createSpecialDemand(req, res) {
  const { id: userId, name } = req.user;

  try {
    const {
      spare_id,
      tool_id,
      obs_authorised,
      obs_increase_qty,
      internal_demand_no,
      internal_demand_date,
      requisition_no,
      requisition_date,
      mo_demand_no,
      mo_demand_date,
    } = req.body;

    console.log("REQ.BODY =>", req.body);

    // 🔹 check if ALL 6 fields are filled
    const allDemandFieldsFilled =
      internal_demand_no &&
      internal_demand_date &&
      requisition_no &&
      requisition_date &&
      mo_demand_no &&
      mo_demand_date;

    /* =====================================================
       CASE 1: All fields present → INSERT INTO pending_issue
       ===================================================== */
    if (allDemandFieldsFilled) {
      const pendingIssueQuery = `
        INSERT INTO pending_issue (
          spare_id,
          tool_id,
          demand_no,
          demand_date,
          demand_quantity,
          nac_no,
          nac_date,
          mo_no,
          mo_date,
          created_by,
          created_at,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
      `;

      await pool.query(pendingIssueQuery, [
        spare_id || null,
        tool_id || null,

        internal_demand_no,
        internal_demand_date,
        obs_increase_qty,

        requisition_no,
        requisition_date,
        mo_demand_no,
        mo_demand_date,

        userId,
      ]);

      return res.json({
        success: true,
        message: "Inserted directly into Pending Issue",
      });
    }

    /* =====================================================
       CASE 2: Any field missing → INSERT INTO special_demand
       ===================================================== */
    const specialDemandQuery = `
      INSERT INTO special_demand (
        spare_id,
        tool_id,
        obs_authorised,
        obs_increase_qty,
        internal_demand_no,
        internal_demand_date,
        requisition_no,
        requisition_date,
        mo_demand_no,
        mo_demand_date,
        created_by,
        created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(specialDemandQuery, [
      spare_id || null,
      tool_id | null,
      obs_authorised,
      obs_increase_qty,
      internal_demand_no || null,
      internal_demand_date || null,
      requisition_no || null,
      requisition_date || null,
      mo_demand_no || null,
      mo_demand_date || null,
      userId,
      name,
    ]);

    res.json({
      success: true,
      message: "Special Demand created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getSpecialDemandList(req, res) {
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const offset = (page - 1) * limit;
  const [totalCount] = await pool.query(
    `SELECT COUNT(*) as count FROM special_demand `,
  );
  const total = totalCount[0].count;
  if (total === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
        },
        "No spare found",
      ),
    );
  }

  try {
    const query = `
      SELECT
        sd.id,
        sd.spare_id,
        sd.tool_id,

        sd.obs_authorised,
        sd.obs_increase_qty,

        sd.internal_demand_no,
        sd.internal_demand_date,
        sd.requisition_no,
        sd.requisition_date,
        sd.mo_demand_no,
        sd.mo_demand_date,

        sd.created_by,
        sd.created_by_name,
        sd.created_at,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN 'spares'
          WHEN sd.tool_id IS NOT NULL THEN 'tools'
          ELSE 'unknown'
        END AS source,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.description
          WHEN sd.tool_id IS NOT NULL THEN t.description
          ELSE NULL
        END AS description,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.indian_pattern
          WHEN sd.tool_id IS NOT NULL THEN t.indian_pattern
          ELSE NULL
        END AS indian_pattern,

        CASE
          WHEN sd.spare_id IS NOT NULL THEN s.category
          WHEN sd.tool_id IS NOT NULL THEN t.category
          ELSE NULL
        END AS category

      FROM special_demand sd
      LEFT JOIN spares s ON s.id = sd.spare_id
      LEFT JOIN tools t on t.id = sd.tool_id
      ORDER BY sd.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [limit, offset]);

    res.json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        "Spares retrieved successfully",
      ),
    );
  } catch (err) {
    console.error("GET SPECIAL DEMAND ERROR =>", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch special demand list",
    });
  }
}

async function updateSpacialDemand(req, res) {
  const {
    id,
    internal_demand_no,
    internal_demand_date,
    requisition_no,
    requisition_date,
    mo_demand_no,
    mo_demand_date,
  } = req.body;
  try {
    const query = `UPDATE special_demand SET internal_demand_no = ?, internal_demand_date = ?, requisition_no = ?, requisition_date = ?, mo_demand_no = ?, mo_demand_date = ? WHERE id = ?`;
    await pool.query(query, [
      internal_demand_no,
      internal_demand_date,
      requisition_no || null,
      requisition_date || null,
      mo_demand_no || null,
      mo_demand_date || null,
      id,
    ]);
    res.status(200).json(new ApiResponse(200, {}, "Updated successfully"));
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Internal server error"));
  }
}

module.exports = {
  createSpecialDemand,
  getSpecialDemandList,
  updateSpacialDemand,
};
