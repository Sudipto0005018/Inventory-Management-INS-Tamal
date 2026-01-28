// const a = [{"no":"001","qn":"10","qtyHeld":"30"},{"no":"002","qn":"10","qtyHeld":"","location":""},{"no":"003","qn":"8","qtyHeld":"","location":""}]

const box_no = [
  { no: "001", qn: "10", qtyHeld: "30" },
  { no: "002", qn: "10", qtyHeld: "", location: "" },
  { no: "003", qn: "8", qtyHeld: "", location: "" },
];

const a = JSON.parse(JSON.stringify(box_no));

a[0].qtyHeld = 30;

let prev = 0;
let now = 0;

for (let i = 0; i < box_no.length; i++) {
  prev += parseInt(box_no[i].qtyHeld || "0");
  now += parseInt(a[i].qtyHeld || "0");
}

if (prev > now) {
  console.log("Dialog open");
} else {
  console.log("dialog not open");
}