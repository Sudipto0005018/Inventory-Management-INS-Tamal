const fs = require("fs");
const path = require("path");

const pool = require("./dbConnect");

const uploadsDir =
  process.env.NODE_ENV == "production"
    ? path.join(__dirname, "uploads")
    : path.join(__dirname, "../uploads");
async function exportUsersToCSV() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const csvFilePath = path.join(uploadsDir, "user.csv");
    const writeStream = fs.createWriteStream(csvFilePath);
    writeStream.write(
      "id,username,name,department,role,password,sync_status\n",
    );

    const BATCH_SIZE = 5000;
    let offset = 0;
    let totalProcessed = 0;

    while (true) {
      const [rows] = await pool.query(
        "SELECT id, username, name, department, role, password, sync_status FROM users WHERE status = 1 LIMIT ? OFFSET ?",
        [BATCH_SIZE, offset],
      );
      if (rows.length === 0) {
        break;
      }
      for (const row of rows) {
        const csvRow =
          [
            row.id,
            escapeCsvValue(row.username),
            escapeCsvValue(row.name),
            escapeCsvValue(row.department),
            escapeCsvValue(row.role),
            escapeCsvValue(row.password),
            row.sync_status,
          ].join(",") + "\n";

        writeStream.write(csvRow);
      }

      totalProcessed += rows.length;
      if (rows.length < BATCH_SIZE) {
        break;
      }

      offset += BATCH_SIZE;
    }
    writeStream.end();
    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        resolve(csvFilePath);
      });
      writeStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error creating CSV:", error);
    throw error;
  }
}

async function exportItemToCSV(tableName) {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const csvFilePath = path.join(
      uploadsDir,
      tableName == "spares" ? "spare.csv" : "tool.csv",
    );
    const writeStream = fs.createWriteStream(csvFilePath);

    writeStream.write(
      "id,description,indian_pattern,category,equipment_system,obs_authorised,obs_held,box_no\n",
    );

    const [rows] = await pool.query(`
      SELECT
        s.id,
        s.description,
        s.indian_pattern,
        s.category,
        s.equipment_system,
        s.obs_authorised,
        s.obs_held,
        s.box_no
      FROM ${tableName} s
    `);

    for (const row of rows) {
      const csvRow =
        [
          row.id,
          escapeCsvValue(row.description),
          escapeCsvValue(row.indian_pattern),
          escapeCsvValue(row.category),
          escapeCsvValue(row.equipment_system),
          escapeCsvValue(row.obs_authorised),
          escapeCsvValue(row.obs_held),
          escapeCsvValue(
            typeof row.box_no === "object"
              ? JSON.stringify(row.box_no)
              : row.box_no,
          ),
        ].join(",") + "\n";

      writeStream.write(csvRow);
    }

    writeStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(csvFilePath));
      writeStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error creating Spare CSV:", error);
    throw error;
  }
}

async function exportConfigToCSV() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const csvFilePath = path.join(uploadsDir, "config.csv");
    const writeStream = fs.createWriteStream(csvFilePath);

    // ✅ Header
    writeStream.write("id,type,attr_1,attr_2,attr_3,attr_4\n");

    // ✅ Fetch data
    const [rows] = await pool.query(`
      SELECT id, type, attr_1, attr_2, attr_3, attr_4
      FROM config
    `);

    // ✅ Write rows
    for (const row of rows) {
      const csvRow =
        [
          row.id,
          escapeCsvValue(row.type),
          escapeCsvValue(row.attr_1),
          escapeCsvValue(row.attr_2),
          escapeCsvValue(row.attr_3),
          escapeCsvValue(row.attr_4),
        ].join(",") + "\n";

      writeStream.write(csvRow);
    }

    writeStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(csvFilePath));
      writeStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error creating Config CSV:", error);
    throw error;
  }
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

module.exports = {
  exportUsersToCSV,
  escapeCsvValue,
  exportItemToCSV,
  exportConfigToCSV,
};

if (require.main === module) {
  exportConfigToCSV();
}
