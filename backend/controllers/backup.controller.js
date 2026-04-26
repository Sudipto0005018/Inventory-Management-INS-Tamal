// controllers/backup.controller.js
const { backupDatabase } = require("../utils/backup");

const triggerBackup = async (req, res) => {
  try {
    const file = await backupDatabase();

    return res.status(200).json({
      success: true,
      message: "Backup completed successfully",
      file,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Backup failed",
    });
  }
};

module.exports = { triggerBackup };
