const { execFile, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const ApiErrorResponse = require("../utils/ApiErrorResponse");
const ApiResponse = require("../utils/ApiResponse");
const {
  syncInventoryCSV,
  exportUsersToCSV,
  exportItemToCSV,
} = require("../utils/csvGeneration");

const adbPath =
  os.platform() == "win32"
    ? path.join(__dirname, "..", "platform_tools", "adb.exe")
    : path.join(__dirname, "..", "platform_tools", "adb");

const uploadDir = path.join(__dirname, "../uploads");
const destination = "/storage/emulated/0/Documents/";
const pool = require("../utils/dbConnect");
const { getISTString } = require("../utils/helperFunctions");

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
    `com.example.equipmentmonitoring.${signalName}`,
    "-n",
    "com.example.equipmentmonitoring/.CsvGenerationReceiver",
  ];

  try {
    const stdout = await runAdb(args);
    return { success: true, message: "Signal Sent", output: stdout };
  } catch (error) {
    console.error(`Error signaling device ${deviceId}:`, error);
    throw { error: "Signal Failed", details: error };
  }
};

const adbSync = async (deviceId) => {
  const spareCsvPath = path.join(uploadDir, "spares_inventory.csv");

  try {
    await sendSignalToDevice(deviceId, "GENERATE_CSV");

    await exportUsersToCSV();
    await exportItemToCSV();

    // Push user.csv
    await runAdb([
      "-s",
      deviceId,
      "push",
      path.join(uploadDir, "user.csv"),
      destination,
    ]);

    // Push spares_inventory.csv
    await runAdb(["-s", deviceId, "push", spareCsvPath, destination]);

    await sendSignalToDevice(deviceId, "SYNC_USERS");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Pull updated CSV from device
    await runAdb([
      "-s",
      deviceId,
      "pull",
      destination + "spares_inventory.csv",
      spareCsvPath,
    ]);

    if (!fs.existsSync(spareCsvPath)) {
      throw new Error("Sync Failed");
    }

    await syncInventoryCSV();

    // Cleanup local files
    [spareCsvPath, path.join(uploadDir, "user.csv")].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    // Cleanup device file
    await runAdb([
      "-s",
      deviceId,
      "shell",
      "rm",
      destination + "spares_inventory.csv",
    ]);
  } catch (error) {
    console.error(`Error syncing device ${deviceId}:`, error);

    throw {
      error: "CSV Generation Failed",
      details: error,
    };
  }
};

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

    const currentIST = getISTString();
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
  adbSync
};
