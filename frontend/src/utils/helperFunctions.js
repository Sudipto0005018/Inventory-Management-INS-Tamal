export function capitalizeWords(sentence) {
  if (!sentence || typeof sentence !== "string") {
    return "";
  }

  return sentence
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function validateUsername(str) {
  const regex = /^(?=[a-z])[a-z0-9_]+$/;
  return regex.test(str);
}

export function makeAvatarName(name) {
  if (!name) return "";
  const initials = name
    ?.split(" ")
    ?.map((word) => word.charAt(0).toUpperCase())
    ?.join("");
  return initials;
}

export function formatSimpleDate(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(d.getDate()).padStart(2, "0")}`;
  
}

export function getDate(date) {
  const y = date.substring(0, 4);
  const m = date.substring(4, 6);
  const d = date.substring(6, 8);
  return `${d}-${m}-${y}`;
}

export function getDateStrToDate(date) {
  if (!date || typeof date !== "string") return "";
  const y = date.substring(0, 4);
  const m = date.substring(4, 6);
  const d = date.substring(6, 8);
  const dt = new Date();
  dt.setFullYear(y);
  dt.setMonth(m - 1);
  dt.setDate(d);
  return dt;
}
export function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDate(date, days) {
  const d = date ? new Date(date) : new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function getFormatedDate(dat = new Date()) {
  if (!dat) return "";

  const date = new Date(dat);
  if (isNaN(date.getTime())) return "";

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const d = String(date.getDate()).padStart(2, "0");
  const m = months[date.getMonth()];
  const y = String(date.getFullYear()).slice(-2);

  return `${d}-${m}-${y}`;
}

export function getISTTimestamp(jsTimeStamp) {
  const d = new Date(jsTimeStamp);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  return date;
}