const spares = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "Indian Pattern", key: "indian_pattern", width: 20 },
  { header: "Equipment System", key: "equipment_system", width: 25 },
  { header: "Category", key: "category", width: 20 },
  { header: "Denos", key: "denos", width: 12 },
  {
    header: "OBS Authorised / Maintained",
    key: "obs_authorised",
    width: 28,
  },
  { header: "OBS Held", key: "obs_held", width: 15 },
  { header: "Box No.", key: "boxes", width: 15 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  {
    header: "Location of Storage",
    key: "storage_location",
    width: 25,
  },
];

const tools = [
  { header: "Item Description", key: "description", width: 30 },
  { header: "Indian Pattern", key: "indian_pattern", width: 20 },
  { header: "Equipment System", key: "equipment_system", width: 25 },
  { header: "Category", key: "category", width: 20 },
  { header: "Denos", key: "denos", width: 12 },
  {
    header: "OBS Authorised / Maintained",
    key: "obs_authorised",
    width: 28,
  },
  { header: "OBS Held", key: "obs_held", width: 15 },
  { header: "Box No.", key: "boxes", width: 15 },
  { header: "Item Distribution", key: "itemDistribution", width: 25 },
  {
    header: "Location of Storage",
    key: "storage_location",
    width: 25,
  },
];

const procurement = [
  { header: "NAC Qty", key: "nac_qty", width: 30 },
  { header: "NAC No.", key: "nac_no", width: 20 },
  { header: "Validity", key: "validity", width: 20 },
  { header: "Rate/ Unit", key: "rate_unit", width: 12 },
  { header: "Box No.", key: "boxes", width: 15 },
  //   { header: "Item Distribution", key: "itemDistribution", width: 25 },
  { header: "Received Qty", key: "qty_received", width: 15 },
];

module.exports = { spares, tools, procurement };
