const spares = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "Indian Part No.", key: "indian_pattern", width: 20 },
  { header: "Equipment /System", key: "equipment_system", width: 25 },
  { header: "Category", key: "category", width: 20 },
  { header: "Denos", key: "denos", width: 12 },
  { header: "OBS Authorised / Maintained", key: "obs_authorised", width: 28 },
  { header: "OBS Held", key: "obs_held", width: 15 },
  { header: "Box No.", key: "boxes", width: 20 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Location of Storage", key: "storage_location", width: 25 },
];

const tools = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "Indian Part No.", key: "indian_pattern", width: 20 },
  { header: "Equipment /System", key: "equipment_system", width: 25 },
  { header: "Category", key: "category", width: 20 },
  { header: "Denos", key: "denos", width: 12 },
  { header: "OBS Authorised / Maintained", key: "obs_authorised", width: 28 },
  { header: "OBS Held", key: "obs_held", width: 15 },
  { header: "Box No.", key: "boxes", width: 20 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Location of Storage", key: "storage_location", width: 25 },
];

const procurement = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "IN Part No.", key: "indian_pattern", width: 20 },
  { header: "Category", key: "category", width: 20 },
  { header: "Equipment /System", key: "equipment_system", width: 25 },

  { header: "NAC Qty", key: "nac_qty", width: 10 },
  { header: "NAC No.", key: "nac_no", width: 20 },
  { header: "NAC Date", key: "nac_date", width: 20 },
  { header: "Validity", key: "validity", width: 10 },
  { header: "Rate/ Unit", key: "rate_unit", width: 12 },

  { header: "Demand No.", key: "demand_no", width: 20 },
  { header: "Denmand Date", key: "demand_date", width: 20 },
  { header: "Demanded Qty", key: "demand_quantity", width: 15 },

  { header: "Issue Date", key: "issue_date", width: 20 },
  { header: "Box No.", key: "boxes", width: 20 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Received Qty", key: "qty_received", width: 15 },
  { header: "Created On", key: "created_at", width: 20 },
];

const stock_update = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "IN Part No.", key: "indian_pattern", width: 20 },
  { header: "Category", key: "category", width: 20 },
  { header: "Equipment /System", key: "equipment_system", width: 25 },

  { header: "Stocked In Qty", key: "stocked_in_qty", width: 20 },
  { header: "MO No.", key: "mo_no", width: 20 },
  { header: "MO Date", key: "mo_date", width: 20 },
  { header: "Demand No.", key: "demand_no", width: 20 },
  { header: "Denmand Date", key: "demand_date", width: 20 },
  { header: "Demanded Qty", key: "demand_quantity", width: 15 },

  { header: "Issue Date", key: "issue_date", width: 20 },
  { header: "Box No.", key: "boxes", width: 20 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Received Qty", key: "qty_received", width: 15 },
  { header: "Created On", key: "created_at", width: 20 },
];

const survey = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "IN Part No.", key: "indian_pattern", width: 20 },
  { header: "Category", key: "category", width: 20 },
  { header: "Equipment /System", key: "equipment_system", width: 25 },

  { header: "Issued To", key: "issue_to", width: 15 },
  { header: "Survey Qty", key: "survey_quantity", width: 15 },
  { header: "Withdrawal Qty", key: "withdrawl_qty", width: 18 },
  { header: "Withdrawal Date", key: "withdrawl_date", width: 20 },
  { header: "Service No.", key: "service_no", width: 18 },
  { header: "Name", key: "name", width: 20 },
  { header: "Box No.", key: "boxes", width: 20 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Created On", key: "created_at", width: 20 },
];

const demand = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "IN Part No.", key: "indian_pattern", width: 20 },
  { header: "Category", key: "category", width: 20 },
  { header: "Equipment /System", key: "equipment_system", width: 25 },

  { header: "Issued To", key: "issue_to", width: 15 },
  { header: "Surveyed Qty", key: "survey_qty", width: 15 },
  { header: "Survey Voucher No.", key: "survey_voucher_no", width: 22 },
  { header: "Surveyed Date", key: "survey_date", width: 20 },
  { header: "Created On", key: "created_at", width: 20 },
];

const issue = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "IN Pattern No.", key: "indian_pattern", width: 25 },
  { header: "Category", key: "category", width: 25 },
  { header: "Equipment /System", key: "equipment_system", width: 30 },

  { header: "Stocked In / NAC Qty", key: "stocked_nac_qty", width: 22 },
  { header: "Quote Authority", key: "quote_authority", width: 25 },
  { header: "Box No.", key: "box_no", width: 35 },
  // { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Demand No.", key: "demand_no", width: 20 },
  { header: "Demand Date", key: "demand_date", width: 20 },
  { header: "Requisition No.", key: "requisition_no", width: 25 },
  { header: "Requisition Date", key: "requisition_date", width: 20 },
  { header: "MO No.", key: "mo_no", width: 20 },
  { header: "MO Date", key: "mo_date", width: 20 },
  { header: "Demanded Qty", key: "demand_quantity", width: 18 },
  { header: "Returned Qty", key: "qty_received", width: 18 },
  { header: "Returned Date", key: "return_date", width: 20 },
  { header: "Created On", key: "created_at", width: 20 },
];

const special_demand = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "IN Part No.", key: "indian_pattern", width: 25 },
  { header: "Category", key: "category", width: 25 },

  { header: "Modified OBS Authorised", key: "obs_authorised", width: 30 },
  { header: "OBS Authorised Inc Qty", key: "obs_increase_qty", width: 30 },
  { header: "Quote Authority", key: "quote_authority", width: 25 },

  { header: "Internal Demand No.", key: "internal_demand_no", width: 25 },
  { header: "Internal Demand Date", key: "internal_demand_date", width: 25 },
  { header: "Requisition No.", key: "requisition_no", width: 20 },
  { header: "Requisition Date", key: "requisition_date", width: 20 },
  { header: "MO Demand No.", key: "mo_demand_no", width: 20 },
  { header: "MO Demand Date", key: "mo_demand_date", width: 20 },

  { header: "Created By", key: "created_by_name", width: 20 },
  { header: "Created On", key: "created_at", width: 20 },
];

module.exports = {
  spares,
  tools,
  procurement,
  stock_update,
  survey,
  demand,
  issue,
  special_demand,
};
