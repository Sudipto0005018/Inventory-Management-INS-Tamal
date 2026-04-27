const fs = require("fs");
const path = require("path");
// const { sendBackupFailedMail } = require("./controllers/mail.controller");
require("dotenv").config();
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const BACKUP_DIR =
  process.env.NODE_ENV == "production"
    ? path.join(__dirname, "backups")
    : path.join(__dirname, "..", "backups");

const getTimeStamp = () => {
  const date = new Date();
  const year = (date.getFullYear() % 100).toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${day}${month}${year}${hours}${minutes}${seconds}`;
};

async function backupDatabase() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const mysqldumpPath =
    '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"';

  const timestamp = getTimeStamp();
  const fileName = `backup_${process.env.DB_NAME}_${timestamp}.sql`;
  const outputPath = path.join(BACKUP_DIR, fileName);

  try {
    await execPromise(
      `${mysqldumpPath} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${outputPath}"`,
    );
    // await execPromise(
    //   `copy "${outputPath}" "\\\\${process.env.BACKUP_PC_IP}\\${process.env.SHARED_FOLDER}\\${fileName}"`,
    // );

    return outputPath;
  } catch (error) {
    // throw new Error(error.message);
  } finally {
    // fs.unlinkSync(outputPath);
  }
}

if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };
