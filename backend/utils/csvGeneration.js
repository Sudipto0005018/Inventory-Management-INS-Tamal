const fs = require("fs");
const path = require("path");

const csv = require("csv-parser");

const { convertArrayString } = require("./helperFunctions");
const pool = require("./dbConnect");
const { fields, fieldNames, jsonFields, fieldMap } = require("./fieldNames");

async function exportUsersToCSV() {
    try {
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const csvFilePath = path.join(__dirname, "../uploads", "user.csv");
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

async function exportInventoryToCSV() {
    try {
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const csvFilePath = path.join(uploadsDir, "inventory.csv");
        const writeStream = fs.createWriteStream(csvFilePath);

        // CSV Header
        writeStream.write(
            "source,description,indian_pattern,equipment_system,obs_authorised,obs_held,box_no\n",
        );

        const tables = ["spares", "tools", "doc_corner"];

        for (const table of tables) {
            const [rows] = await pool.query(
                `SELECT description, indian_pattern, equipment_system, obs_authorised, obs_held, box_no FROM ${table}`,
            );

            for (const row of rows) {
                const csvRow =
                    [
                        table, // source table name
                        escapeCsvValue(row.description),
                        escapeCsvValue(row.indian_pattern),
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
        }

        writeStream.end();

        return new Promise((resolve, reject) => {
            writeStream.on("finish", () => resolve(csvFilePath));
            writeStream.on("error", reject);
        });
    } catch (error) {
        console.error("Error creating Inventory CSV:", error);
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

async function generateConfig() {
    const connection = await pool.getConnection();
    const finalJson = {};

    try {
        const tables = ["spares", "tools", "doc_corner"];

        for (const table of tables) {
            let query = "";

            // doc_corner has slightly different data types
            if (table === "doc_corner") {
                query = `
                    SELECT 
                        description,
                        indian_pattern,
                        equipment_system,
                        box_no,
                        obs_authorised,
                        obs_held
                    FROM doc_corner
                `;
            } else {
                query = `
                    SELECT 
                        description,
                        indian_pattern,
                        equipment_system,
                        box_no,
                        obs_authorised,
                        obs_held
                    FROM ${table}
                `;
            }

            const [rows] = await connection.execute(query);

            finalJson[table] = rows.map((row) => ({
                description: row.description || "",
                indian_pattern: row.indian_pattern || "",
                equipment_system: row.equipment_system || "",
                box_no: typeof row.box_no === "object" ? row.box_no : row.box_no || "",
                obs_authorised: row.obs_authorised || 0,
                obs_held: row.obs_held || 0,
            }));
        }

        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const configPath = path.join(uploadsDir, "config.txt");

        await fs.promises.writeFile(configPath, JSON.stringify(finalJson, null, 4));

        return configPath;
    } catch (error) {
        console.error("Error generating inventory config:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function syncInventoryCSV() {
  const connection = await pool.getConnection();
  const filePath = path.join(__dirname, "../uploads", "inventory.csv");

  try {
    await connection.beginTransaction();

    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath).pipe(csv());

      stream.on("data", async (row) => {
        stream.pause();

        try {
          const {
            source,
            description,
            indian_pattern,
            equipment_system,
            obs_authorised,
            obs_held,
            box_no,
          } = row;

          const tableMap = {
            spares: "spares",
            tools: "tools",
            doc_corner: "doc_corner",
          };

          const tableName = tableMap[source];
          if (!tableName) {
            stream.resume();
            return;
          }

          const query = `
                        INSERT INTO ${tableName}
                        (description, indian_pattern, equipment_system, obs_authorised, obs_held, box_no)
                        SELECT ?, ?, ?, ?, ?, ?
                        FROM DUAL
                        WHERE NOT EXISTS (
                            SELECT 1 FROM ${tableName}
                            WHERE description = ?
                            AND indian_pattern = ?
                            AND equipment_system = ?
                        )
                    `;

          await connection.execute(query, [
            description,
            indian_pattern,
            equipment_system,
            obs_authorised,
            obs_held,
            box_no,
            description,
            indian_pattern,
            equipment_system,
          ]);

          stream.resume();
        } catch (err) {
          reject(err);
        }
      });

      stream.on("end", resolve);
      stream.on("error", reject);
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Inventory Sync Error:", error);
    throw error;
  } finally {
    connection.release();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
    exportUsersToCSV,
    escapeCsvValue,
    generateConfig,
    syncInventoryCSV,
    exportInventoryToCSV,
};
