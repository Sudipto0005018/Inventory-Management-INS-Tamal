const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

dotenv.config({ path: "./.env", quiet: true });

app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "build")));
app.use("/images", express.static(path.join(__dirname, "uploads")));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.get("/api/helth", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Equipment Monitoring System API",
  });
});

app.use("/api/v1/users", require("./routes/user.routes"));
app.use("/api/v1/departments", require("./routes/departments.routes"));
app.use("/api/v1/spares", require("./routes/spares.routes"));
app.use("/api/v1/tools", require("./routes/tools.routes"));
app.use("/api/v1/lp", require("./routes/lp.routes"));
app.use("/api/v1/pending", require("./routes/pending.routes"));
app.use("/api/v1/loan", require("./routes/loan.routes"));
app.use("/api/v1/approval", require("./routes/approval.routes"));
app.use("/api/v1/supplier", require("./routes/supplier.routes"));
app.use("/api/v1/oem", require("./routes/oem.routes"));
app.use("/api/v1/config", require("./routes/config.routes"));
app.use("/api/v1/specialDemand", require("./routes/specialDemand.routes"));
app.use("/api/v1/temporaryIssue", require("./routes/temporaryIssue.routes"));
app.use("/api/v1/survey", require("./routes/survey.routes"));

app.listen(process.env.PORT || 7777, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT || 7777}`,
  );
});
