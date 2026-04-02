const { execFile, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const csv = require("csv-parser");

const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const {
  exportUsersToCSV,
  exportItemToCSV,
  exportConfigToCSV,
} = require("../utils/csvGeneration");

const adbPath =
  os.platform() == "win32"
    ? process.env.NODE_ENV == "production"
      ? path.join(__dirname, "platform_tools", "adb.exe")
      : path.join(__dirname, "..", "platform_tools", "adb.exe")
    : process.env.NODE_ENV == "production"
      ? path.join(__dirname, "platform_tools", "adb")
      : path.join(__dirname, "..", "platform_tools", "adb");

const uploadDir =
  process.env.NODE_ENV == "production"
    ? path.join(__dirname, "uploads")
    : path.join(__dirname, "../uploads");
const destination = "/storage/emulated/0/Documents/";
const pool = require("../utils/dbConnect");
const { getSQLTimestamp } = require("../utils/helperFunctions");

if (process.platform !== "win32") {
  exec(`chmod +x "${adbPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error setting permissions: ${error.message}`);
      return;
    }
  });
}

const runAdb = (args) => {
  return new Promise((resolve, reject) => {
    execFile(adbPath, args, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve(stdout);
    });
  });
};

const listDevices = async () => {
  try {
    const stdout = await runAdb(["devices"]);
    return stdout
      .toString()
      .split("\n")
      .filter((line) => line.includes("\tdevice"))
      .map((line) => line.split("\t")[0].trim());
  } catch (error) {
    console.error("Error executing ADB:", error);
    throw error;
  }
};

const sendSignalToDevice = async (deviceId, signalName) => {
  const args = [
    "-s",
    deviceId,
    "shell",
    "am",
    "broadcast",
    "-a",
    `in.gbtsolutions.inventorymanagement.${signalName}`,
    "-n",
    "in.gbtsolutions.inventorymanagement/.SignalReceiver",
  ];

  try {
    const stdout = await runAdb(args);
    return { success: true, message: "Signal Sent", output: stdout };
  } catch (error) {
    console.error(`Error signaling device ${deviceId}:`, error);
    throw { error: "Signal Failed", details: error };
  }
};

async function manualAdbSync(req, res) {
  const { deviceId } = req.params;

  if (!deviceId) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "Device ID is required"));
  }

  try {
    await adbSync(deviceId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "ADB sync successful"));
  } catch (error) {
    console.error("ADB sync failed:", error);

    return res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "ADB sync failed"));
  }
}

async function adbSync(deviceId) {
  const sparesPath = path.join(uploadDir, "spare.csv");
  const toolsPath = path.join(uploadDir, "tool.csv");
  const configPath = path.join(uploadDir, "config.csv");
  const userPath = path.join(uploadDir, "user.csv");
  try {
    await exportUsersToCSV();
    await exportConfigToCSV();
    await sendSignalToDevice(deviceId, "GEN_CSVS");

    await runAdb(["-s", deviceId, "push", userPath, destination + "."]);
    await runAdb(["-s", deviceId, "push", configPath, destination + "."]);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await sendSignalToDevice(deviceId, "SYNC_USER_CONFIG");
    await pullCSVs(deviceId);
    await syncAssets("spares");
    await syncAssets("tools");
    await syncSurvey();
    await syncDemand();
    await syncTemporaryIssue();
    await syncTyLoan();
    await syncBoxTransaction();
    await syncObsAudit();

    await exportItemToCSV("spares");
    await exportItemToCSV("tools");
    await runAdb(["-s", deviceId, "push", sparesPath, destination + "."]);
    await runAdb(["-s", deviceId, "push", toolsPath, destination + "."]);
    await sendSignalToDevice(deviceId, "SYNC_SPARE_TOOL");
    unlinkFiles([
      sparesPath,
      toolsPath,
      userPath,
      configPath,
      path.join(uploadDir, "spares.csv"),
      path.join(uploadDir, "tools.csv"),
      path.join(uploadDir, "box_transaction.csv"),
      path.join(uploadDir, "demand.csv"),
      path.join(uploadDir, "obs_audit.csv"),
      path.join(uploadDir, "survey.csv"),
      path.join(uploadDir, "temporary_issue_local.csv"),
      path.join(uploadDir, "ty_loan.csv"),
    ]);
  } catch (error) {
    console.error(`Error syncing device ${deviceId}:`, error);

    throw {
      error: "CSV Generation Failed",
      details: error,
    };
  }
}

// async function pullCSVs(deviceId) {
//   const csvs = [
//     "spares",
//     "tools",
//     "demand",
//     "survey",
//     "temporary_issue_local",
//     "ty_loan",
//     "box_transaction",
//     "obs_audit",
//   ];

//   for await (const csv of csvs) {
//     await runAdb([
//       "-s",
//       deviceId,
//       "pull",
//       destination + csv + ".csv",
//       path.join(uploadDir, csv + ".csv"),
//     ]);
//   }
// }

async function pullCSVs(deviceId) {
  const csvs = [
    "spares",
    "tools",
    "demand",
    "survey",
    "temporary_issue_local",
    "ty_loan",
    "box_transaction",
    "obs_audit",
  ];

  for (const csvFile of csvs) {
    try {
      await runAdb([
        "-s",
        deviceId,
        "pull",
        destination + csvFile + ".csv",
        path.join(uploadDir, csvFile + ".csv"),
      ]);
    } catch (error) {
      console.error(`Failed pulling ${csvFile}:`, error.message);
    }
  }
}

function unlinkFiles(files) {
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

async function syncAssets(tableName) {
  const filePath = path.join(uploadDir, `${tableName}.csv`);
  const connection = await pool.getConnection();
  let changedRowsCount = 0;
  try {
    await connection.beginTransaction();
    const stream = fs.createReadStream(filePath).pipe(csv());
    for await (const row of stream) {
      let { table_id: id, box_no: csvBoxInput, obs_held } = row;
      const incomingBoxes =
        typeof csvBoxInput === "string" ? JSON.parse(csvBoxInput) : csvBoxInput;
      const [rows] = await connection.query(
        `SELECT box_no FROM ?? WHERE id = ?`,
        [tableName, id],
      );
      if (rows.length === 0) continue;
      let dbBox =
        typeof rows[0].box_no === "string"
          ? JSON.parse(rows[0].box_no)
          : rows[0].box_no;
      const incomingMap = new Map(incomingBoxes.map((b) => [b.no, b.qtyHeld]));

      let hasChanged = false;
      const updatedBox = dbBox.map((item) => {
        if (incomingMap.has(item.no)) {
          const newQty = incomingMap.get(item.no);
          if (item.qtyHeld != newQty) {
            // console.log(
            //   `[CHANGE] ID: ${id} | Box: ${item.no} | Old Qty: ${item.qtyHeld} -> New Qty: ${newQty}`,
            // );
            hasChanged = true;
            return { ...item, qtyHeld: newQty };
          }
        }
        return item;
      });
      if (hasChanged) {
        // console.log(id, JSON.stringify(updatedBox));

        await connection.query(
          `UPDATE ?? SET box_no = ?, obs_held = ? WHERE id = ?`,
          [tableName, JSON.stringify(updatedBox), obs_held, id],
        );
        changedRowsCount++;
      }
    }
    // await connection.commit();
    console.log(`Total records updated: ${changedRowsCount}`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function syncSurvey() {
  const filePath = path.join(uploadDir, `survey.csv`);
  const connection = await pool.getConnection();

  let inserted = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      let {
        transaction_id,
        spare_id,
        tool_id,
        issue_to,
        withdrawl_qty,
        withdrawl_date,
        box_no,
        service_no,
        name,
        created_by,
        created_at,
      } = row;

      // Normalize values
      spare_id = spare_id && spare_id !== "-1" ? parseInt(spare_id) : null;
      tool_id = tool_id && tool_id !== "-1" ? parseInt(tool_id) : null;
      withdrawl_qty = parseInt(withdrawl_qty || 0);

      withdrawl_date =
        withdrawl_date && withdrawl_date.trim() !== ""
          ? withdrawl_date
          : new Date().toISOString().slice(0, 19).replace("T", " ");

      // Parse JSON safely
      let parsedBox = [];

      if (box_no && typeof box_no === "string") {
        try {
          parsedBox = JSON.parse(box_no);
        } catch (e) {
          try {
            const fixed = box_no.replace(/(\w+):/g, '"$1":').replace(/=/g, ":");

            parsedBox = JSON.parse(fixed);
            console.log(`Fixed malformed JSON: ${transaction_id}`);
          } catch (err) {
            console.log(`Invalid JSON for box_no: ${transaction_id}`);
            console.log("Raw:", box_no);
            parsedBox = [];
          }
        }
      }

      // Optional safety
      if (!spare_id && !tool_id) {
        console.log(`Skipping invalid survey row: ${transaction_id}`);
        continue;
      }

      const [existing] = await connection.query(
        `SELECT id FROM survey WHERE transaction_id = ?`,
        [transaction_id],
      );

      if (existing.length > 0) {
        // await connection.query(
        //   `UPDATE survey
        //    SET spare_id = ?, tool_id = ?, issue_to = ?,
        //        withdrawl_qty = ?, withdrawl_date = ?,
        //        box_no = ?, service_no = ?, name = ?,
        //        created_by = ?, created_at = ?
        //    WHERE transaction_id = ?`,
        //   [
        //     spare_id,
        //     tool_id,
        //     issue_to,
        //     withdrawl_qty,
        //     withdrawl_date,
        //     JSON.stringify(parsedBox),
        //     service_no,
        //     name,
        //     created_by,
        //     created_at,
        //     transaction_id,
        //   ],
        // );

        updated++;
      } else {
        await connection.query(
          `INSERT INTO survey 
           (transaction_id, spare_id, tool_id, issue_to, 
            withdrawl_qty, withdrawl_date, box_no, 
            service_no, name, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            spare_id,
            tool_id,
            issue_to,
            withdrawl_qty,
            withdrawl_date,
            JSON.stringify(parsedBox),
            service_no,
            name,
            created_by,
            created_at,
          ],
        );

        inserted++;
      }
    }

    await connection.commit();

    console.log(`Survey Sync → Inserted: ${inserted}, Updated: ${updated}`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Survey sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function syncDemand() {
  const filePath = path.join(uploadDir, `demand.csv`);
  const connection = await pool.getConnection();

  let inserted = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      let {
        transaction_id,
        spare_id,
        tool_id,
        survey_qty,
        survey_voucher_no,
        survey_date,
        created_by,
        created_at,
      } = row;

      spare_id = spare_id && spare_id !== "-1" ? spare_id : null;
      tool_id = tool_id && tool_id !== "-1" ? tool_id : null;
      survey_qty = parseInt(survey_qty || 0);

      // spare_id = spare_id && spare_id !== "-1" ? parseInt(spare_id) : null;
      // tool_id = tool_id && tool_id !== "-1" ? parseInt(tool_id) : null;
      // survey_qty = parseInt(survey_qty || 0);

      // Check if record exists
      const [existing] = await connection.query(
        `SELECT id FROM demand WHERE transaction_id = ?`,
        [transaction_id],
      );

      if (existing.length > 0) {
        // await connection.query(
        //   `UPDATE demand
        //    SET spare_id = ?, tool_id = ?, survey_qty = ?,
        //        survey_voucher_no = ?, survey_date = ?,
        //        created_by = ?, created_at = ?
        //    WHERE transaction_id = ?`,
        //   [
        //     spare_id,
        //     tool_id,
        //     survey_qty,
        //     survey_voucher_no,
        //     survey_date,
        //     created_by,
        //     created_at,
        //     transaction_id,
        //   ],
        // );

        updated++;
      } else {
        await connection.query(
          `INSERT INTO demand 
           (transaction_id, spare_id, tool_id, survey_qty, 
            survey_voucher_no, survey_date, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            spare_id,
            tool_id,
            survey_qty,
            survey_voucher_no,
            survey_date,
            created_by,
            created_at,
          ],
        );
        inserted++;
      }
    }

    await connection.commit();

    console.log(`Inserted: ${inserted}, Updated: ${updated}`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Demand sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function syncTemporaryIssue() {
  const filePath = path.join(uploadDir, `temporary_issue_local.csv`);

  if (!fs.existsSync(filePath)) {
    console.error(`temporary_issue_local.csv not found at: ${filePath}`);
    return;
  }

  const connection = await pool.getConnection();

  let inserted = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    const stream = fs
      .createReadStream(filePath)
      .on("error", (err) => {
        console.error("Stream error:", err.message);
      })
      .pipe(csv());

    for await (const row of stream) {
      let {
        transaction_id,
        spare_id,
        tool_id,
        qty_withdrawn,
        service_no,
        issue_to,
        individual_name,
        issue_date,
        loan_duration,
        return_date,
        box_no,
        qty_received,
        created_by,
        created_at,
        approved_by,
        approved_at,
        status,
      } = row;

      // Normalize IDs (-1 → NULL)
      spare_id = spare_id && spare_id !== "-1" ? parseInt(spare_id) : null;
      tool_id = tool_id && tool_id !== "-1" ? parseInt(tool_id) : null;
      approved_by =
        approved_by && approved_by !== "-1" ? parseInt(approved_by) : null;

      // Numbers
      qty_withdrawn = qty_withdrawn ? parseInt(qty_withdrawn) : null;
      loan_duration = loan_duration ? parseInt(loan_duration) : null;
      qty_received = qty_received ? parseInt(qty_received) : null;

      // Dates
      issue_date = issue_date && issue_date.trim() !== "" ? issue_date : null;
      return_date =
        return_date && return_date.trim() !== "" ? return_date : null;
      approved_at =
        approved_at && approved_at.trim() !== "" ? approved_at : null;
      created_at =
        created_at && created_at.trim() !== ""
          ? created_at
          : new Date().toISOString().slice(0, 19).replace("T", " ");

      //Required fields check (DB constraints)
      if (
        !transaction_id ||
        !service_no ||
        !issue_to ||
        !issue_date ||
        !created_by
      ) {
        console.log(`Skipping invalid row: ${transaction_id}`);
        continue;
      }

      let parsedBox = null;
      if (box_no && typeof box_no === "string") {
        try {
          parsedBox = JSON.parse(box_no);
        } catch (e) {
          console.log(`Invalid JSON for box_no: ${transaction_id}`);
          console.log("Raw:", box_no);
          parsedBox = null; // DB allows NULL
        }
      }

      const [existing] = await connection.query(
        `SELECT id FROM temporary_issue_local WHERE transaction_id = ?`,
        [transaction_id],
      );

      if (existing.length > 0) {
        await connection.query(
          `UPDATE temporary_issue_local 
           SET spare_id = ?, tool_id = ?, qty_withdrawn = ?, 
               service_no = ?, issue_to = ?, issue_date = ?, 
               loan_duration = ?, return_date = ?, box_no = ?, 
               qty_received = ?, created_by = ?, created_at = ?, 
               approved_by = ?, approved_at = ?, status = ?, 
               individual_name = ?
           WHERE transaction_id = ?`,
          [
            spare_id,
            tool_id,
            qty_withdrawn,
            service_no,
            issue_to,
            issue_date,
            loan_duration,
            return_date,
            parsedBox ? JSON.stringify(parsedBox) : null,
            qty_received,
            created_by,
            created_at,
            approved_by,
            approved_at,
            status,
            individual_name,
            transaction_id,
          ],
        );

        updated++;
      } else {
        await connection.query(
          `INSERT INTO temporary_issue_local 
           (transaction_id, spare_id, tool_id, qty_withdrawn, 
            service_no, issue_to, issue_date, loan_duration, 
            return_date, box_no, qty_received, created_by, created_at, 
            approved_by, approved_at, status, individual_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            spare_id,
            tool_id,
            qty_withdrawn,
            service_no,
            issue_to,
            issue_date,
            loan_duration,
            return_date,
            parsedBox ? JSON.stringify(parsedBox) : null,
            qty_received,
            created_by,
            created_at,
            approved_by,
            approved_at,
            status,
            individual_name,
          ],
        );

        inserted++;
      }
    }

    await connection.commit();

    console.log(
      `Temporary Issue Sync → Inserted: ${inserted}, Updated: ${updated}`,
    );
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Temporary Issue sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function syncTyLoan() {
  const filePath = path.join(uploadDir, `ty_loan.csv`);

  if (!fs.existsSync(filePath)) {
    console.error(`ty_loan.csv not found at: ${filePath}`);
    return;
  }

  const connection = await pool.getConnection();

  let inserted = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    const stream = fs
      .createReadStream(filePath)
      .on("error", (err) => {
        console.error("Stream error:", err.message);
      })
      .pipe(csv());

    for await (const row of stream) {
      let {
        transaction_id,
        spare_id,
        tool_id,
        qty_withdrawn,
        service_no,
        concurred_by,
        issue_date,
        loan_duration,
        return_date,
        box_no,
        qty_received,
        created_by,
        created_at,
        approved_by,
        approved_at,
        status,
        unit_name,
        individual_name,
        phone,
        designation,
      } = row;

      // Normalize IDs (-1 → NULL)
      spare_id = spare_id && spare_id !== "-1" ? parseInt(spare_id) : null;
      tool_id = tool_id && tool_id !== "-1" ? parseInt(tool_id) : null;
      approved_by =
        approved_by && approved_by !== "-1" ? parseInt(approved_by) : null;

      // Numbers
      qty_withdrawn = parseInt(qty_withdrawn || 0);
      loan_duration = loan_duration ? parseInt(loan_duration) : null;
      qty_received = qty_received ? parseInt(qty_received) : null;

      // Dates
      issue_date = issue_date && issue_date.trim() !== "" ? issue_date : null;
      return_date =
        return_date && return_date.trim() !== "" ? return_date : null;
      approved_at =
        approved_at && approved_at.trim() !== "" ? approved_at : null;
      created_at =
        created_at && created_at.trim() !== ""
          ? created_at
          : new Date().toISOString().slice(0, 19).replace("T", " ");

      // issue_date is NOT NULL in DB → must exist
      if (!issue_date) {
        console.log(`Skipping (missing issue_date): ${transaction_id}`);
        continue;
      }

      // Parse box_no JSON
      let parsedBox = [];
      if (box_no && typeof box_no === "string") {
        try {
          parsedBox = JSON.parse(box_no);
        } catch (e) {
          console.log(`Invalid JSON for box_no: ${transaction_id}`);
          console.log("Raw:", box_no);
          parsedBox = [];
        }
      }

      // Check existing
      const [existing] = await connection.query(
        `SELECT id FROM ty_loan WHERE transaction_id = ?`,
        [transaction_id],
      );

      if (existing.length > 0) {
        // UPDATE
        await connection.query(
          `UPDATE ty_loan 
           SET spare_id = ?, tool_id = ?, qty_withdrawn = ?, 
               service_no = ?, concurred_by = ?, issue_date = ?, 
               loan_duration = ?, return_date = ?, box_no = ?, 
               qty_received = ?, created_by = ?, created_at = ?, 
               approved_by = ?, approved_at = ?, status = ?, 
               unit_name = ?, individual_name = ?, phone = ?, designation = ?
           WHERE transaction_id = ?`,
          [
            spare_id,
            tool_id,
            qty_withdrawn,
            service_no,
            concurred_by,
            issue_date,
            loan_duration,
            return_date,
            JSON.stringify(parsedBox),
            qty_received,
            created_by,
            created_at,
            approved_by,
            approved_at,
            status || "pending",
            unit_name,
            individual_name,
            phone,
            designation,
            transaction_id,
          ],
        );

        updated++;
      } else {
        // INSERT
        await connection.query(
          `INSERT INTO ty_loan 
           (transaction_id, spare_id, tool_id, qty_withdrawn, 
            service_no, concurred_by, issue_date, loan_duration, 
            return_date, box_no, qty_received, created_by, created_at, 
            approved_by, approved_at, status, unit_name, 
            individual_name, phone, designation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            spare_id,
            tool_id,
            qty_withdrawn,
            service_no,
            concurred_by,
            issue_date,
            loan_duration,
            return_date,
            JSON.stringify(parsedBox),
            qty_received,
            created_by,
            created_at,
            approved_by,
            approved_at,
            status || "pending",
            unit_name,
            individual_name,
            phone,
            designation,
          ],
        );

        inserted++;
      }
    }

    await connection.commit();

    console.log(`TY Loan Sync → Inserted: ${inserted}, Updated: ${updated}`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("TY Loan sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function syncBoxTransaction() {
  const filePath = path.join(uploadDir, `box_transaction.csv`);

  if (!fs.existsSync(filePath)) {
    console.error(`box_transaction.csv not found at: ${filePath}`);
    return;
  }

  const connection = await pool.getConnection();

  let inserted = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    const stream = fs
      .createReadStream(filePath)
      .on("error", (err) => {
        console.error("Stream error:", err.message);
      })
      .pipe(csv());

    for await (const row of stream) {
      let {
        transaction_id,
        demand_transaction,
        spare_id,
        tool_id,
        box_no,
        prev_qty,
        withdrawl_qty,
        transaction_date,
      } = row;

      // Normalize IDs (-1 → NULL)
      spare_id = spare_id && spare_id !== "-1" ? parseInt(spare_id) : null;
      tool_id = tool_id && tool_id !== "-1" ? parseInt(tool_id) : null;

      // Numbers
      prev_qty = parseInt(prev_qty || 0);
      withdrawl_qty = parseInt(withdrawl_qty || 0);

      // Dates (server expects datetime)
      transaction_date =
        transaction_date && transaction_date.trim() !== ""
          ? transaction_date
          : new Date().toISOString().slice(0, 19).replace("T", " ");

      // box_no cannot be NULL
      if (!box_no || box_no.trim() === "") {
        console.log(`Skipping (missing box_no): ${transaction_id}`);
        continue;
      }

      // Check existing
      const [existing] = await connection.query(
        `SELECT id FROM box_transaction WHERE transaction_id = ?`,
        [transaction_id],
      );

      if (existing.length > 0) {
        // UPDATE
        await connection.query(
          `UPDATE box_transaction
           SET demand_transaction = ?, spare_id = ?, tool_id = ?, 
               box_no = ?, prev_qty = ?, withdrawl_qty = ?, transaction_date = ?
           WHERE transaction_id = ?`,
          [
            demand_transaction,
            spare_id,
            tool_id,
            box_no,
            prev_qty,
            withdrawl_qty,
            transaction_date,
            transaction_id,
          ],
        );
        updated++;
      } else {
        // INSERT
        await connection.query(
          `INSERT INTO box_transaction 
           (transaction_id, demand_transaction, spare_id, tool_id, box_no, prev_qty, withdrawl_qty, transaction_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            demand_transaction,
            spare_id,
            tool_id,
            box_no,
            prev_qty,
            withdrawl_qty,
            transaction_date,
          ],
        );
        inserted++;
      }
    }

    await connection.commit();
    console.log(
      `Box Transaction Sync → Inserted: ${inserted}, Updated: ${updated}`,
    );
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Box Transaction sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function syncObsAudit() {
  const filePath = path.join(uploadDir, `obs_audit.csv`);

  if (!fs.existsSync(filePath)) {
    console.error(`obs_audit.csv not found at: ${filePath}`);
    return;
  }

  const connection = await pool.getConnection();
  let inserted = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    const stream = fs
      .createReadStream(filePath)
      .on("error", (err) => console.error("Stream error:", err.message))
      .pipe(csv());

    for await (const row of stream) {
      let { transaction_id, previous_obs, new_obs, created_at } = row;

      // Normalize numbers
      previous_obs = previous_obs ? parseInt(previous_obs) : 0;
      new_obs = new_obs ? parseInt(new_obs) : 0;

      // Dates
      created_at =
        created_at && created_at.trim() !== ""
          ? created_at
          : new Date().toISOString().slice(0, 19).replace("T", " ");

      if (!transaction_id || transaction_id.trim() === "") {
        console.log("Skipping row with missing transaction_id");
        continue;
      }

      // Check existing
      const [existing] = await connection.query(
        `SELECT id FROM obs_audit WHERE transaction_id = ?`,
        [transaction_id],
      );

      if (existing.length > 0) {
        // UPDATE
        await connection.query(
          `UPDATE obs_audit 
           SET previous_obs = ?, new_obs = ?, created_at = ?
           WHERE transaction_id = ?`,
          [previous_obs, new_obs, created_at, transaction_id],
        );
        updated++;
      } else {
        // INSERT
        await connection.query(
          `INSERT INTO obs_audit (transaction_id, previous_obs, new_obs, created_at)
           VALUES (?, ?, ?, ?)`,
          [transaction_id, previous_obs, new_obs, created_at],
        );
        inserted++;
      }
    }

    await connection.commit();
    console.log(`OBS Audit Sync → Inserted: ${inserted}, Updated: ${updated}`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("OBS Audit sync failed:", error);
  } finally {
    if (connection) connection.release();
  }
}

async function getConnectedDevices(req, res) {
  try {
    const devices = await listDevices();
    if (devices.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No devices found"));
    }
    const [rows] = await pool.query(
      "SELECT uid, name, status, last_sync FROM usb_devices WHERE uid IN (?)",
      [devices],
    );
    const foundMap = new Map(rows.map((row) => [row.uid, row]));
    const finalResult = devices.map((device) => {
      if (foundMap.has(device)) {
        return foundMap.get(device);
      } else {
        return {
          uid: device,
          name: null,
          status: 1,
          last_sync: null,
        };
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, finalResult, "Devices fetched successfully"));
  } catch (error) {
    console.error("Error getting connected devices:", error);
    return res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Error getting connected devices"));
  }
}

async function syncDevice(req, res) {
  const { id: deviceId } = req.params;
  if (!deviceId) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "Device ID is required"));
  }
  try {
    const devices = await listDevices();
    if (!devices.includes(deviceId)) {
      return res
        .status(404)
        .json(new ApiErrorResponse(404, {}, "Device not found"));
    }
    await adbSync(deviceId);

    const currentIST = getSQLTimestamp();
    const [existing] = await pool.query(
      "SELECT uid FROM usb_devices WHERE uid = ?",
      [deviceId],
    );

    if (existing.length > 0) {
      await pool.query("UPDATE usb_devices SET last_sync = ? WHERE uid = ?", [
        currentIST,
        deviceId,
      ]);
    } else {
      await pool.query(
        "INSERT INTO usb_devices (uid, status, last_sync, name) VALUES (?, ?, ?, ?)",
        [deviceId, 1, currentIST, null],
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Device synced successfully"));
  } catch (error) {
    console.error("Error syncing device:", error);
    return res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Error syncing device"));
  }
}

async function updateDevice(req, res) {
  const { uid, name, status } = req.body;
  if (!uid) {
    return res
      .status(400)
      .json(new ApiErrorResponse(400, {}, "Device ID is required"));
  }
  try {
    const [existing] = await pool.query(
      "SELECT uid FROM usb_devices WHERE uid = ?",
      [uid],
    );
    if (existing.length > 0) {
      await pool.query(
        "UPDATE usb_devices SET name = ?, status = ? WHERE uid = ?",
        [name, status, uid],
      );
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Device updated successfully"));
    } else {
      await pool.query(
        "INSERT INTO usb_devices (uid, name, status) VALUES (?, ?, ?)",
        [uid, name, status],
      );
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Device added successfully"));
    }
  } catch (error) {
    console.error("Error updating device:", error);
    return res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Error updating device"));
  }
}

async function getDbUsbHandhelds(req, res) {
  try {
    const devices = await listDevices();
    const [rows] = await pool.query(
      "SELECT uid, name, status, last_sync FROM usb_devices",
    );
    const foundMap = new Map(rows.map((row) => [row.uid, row]));

    const allDeviceIds = new Set([...rows.map((r) => r.uid), ...devices]);

    const finalResult = [...allDeviceIds].map((uid) => {
      if (foundMap.has(uid)) {
        return foundMap.get(uid);
      } else {
        return {
          uid: uid,
          name: null,
          status: 1,
          last_sync: null,
        };
      }
    });
    return res
      .status(200)
      .json(new ApiResponse(200, finalResult, "Devices fetched successfully"));
  } catch (error) {
    console.error("Error getting connected devices:", error);
    return res
      .status(500)
      .json(new ApiErrorResponse(500, {}, "Error getting connected devices"));
  }
}

module.exports = {
  getConnectedDevices,
  syncDevice,
  updateDevice,
  getDbUsbHandhelds,
  pullCSVs,
  sendSignalToDevice,
  adbSync,
  manualAdbSync,
  syncAssets,
  syncDemand,
  syncSurvey,
  syncTyLoan,
  syncTemporaryIssue,
  syncBoxTransaction,
  syncObsAudit,
};
