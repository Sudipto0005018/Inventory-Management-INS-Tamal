const crypto = require("crypto");
require("dotenv").config({ path: "../.env", quiet: true });

function validateUsername(str) {
  const regex = /^(?=[a-z])[a-z0-9_]+$/;
  return regex.test(str);
}

function mergeAndSubArrays(arr1, arr2) {
  const resultMap = arr1.reduce((map, item) => {
    map.set(item.no, { ...item });
    return map;
  }, new Map());
  arr2.forEach((item2) => {
    const { no, qn } = item2;

    if (resultMap.has(no)) {
      resultMap.get(no).qn -= qn;
    } else {
      resultMap.set(no, { no: no, qn: -qn });
    }
  });

  return Array.from(resultMap.values());
}

async function getTimeStamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  return `${day}${m}${y}${hours}${minutes}${seconds}`;
}

function getSQLTimestamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  return `${y}-${m}-${day} ${hours}:${minutes}:${seconds}`;
}

const algorithm = "aes-256-cbc";
const keyHex =
  "3ff0782747a19dff7e6ea74afb097b9df9f4290e369d3a488c37a2ae8192abb3";

const key = Buffer.from(keyHex, "hex");

function encrypt(str) {
  const iv = crypto.randomBytes(16);

  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(str, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + encrypted.toString("hex");
}

function decrypt(encStr = "") {
  if (!encStr) return "";
  let iv = encStr.slice(0, 32);
  iv = Buffer.from(iv, "hex");
  let encHex = encStr.slice(32);
  let encBuffer = Buffer.from(encHex, "hex");
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

function getISTString(systemDate = new Date()) {
  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const parts = new Intl.DateTimeFormat("en-GB", options)
    .formatToParts(systemDate)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

module.exports = {
  validateUsername,
  mergeAndSubArrays,
  getTimeStamp,
  getSQLTimestamp,
  encrypt,
  decrypt,
  getISTString,
};
