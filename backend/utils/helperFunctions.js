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

module.exports = {
  validateUsername,
  mergeAndSubArrays,
  getTimeStamp,
  getSQLTimestamp,
};
