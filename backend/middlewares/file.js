const fs = require("fs");
const multer = require("multer");
const path = require("path");

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
// const maxImageSize = 1024 * 1024;
const maxImageSize = 200 * 1024 * 1024;

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const field = file.fieldname;
    const timestamp = Date.now();
    cb(null, `${field}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, and WEBP image files are allowed"),
        false,
      );
    }
    const maxSize = maxImageSize;
    req.fileSizeLimit = maxSize;
    cb(null, true);
  },
  limits: {
    fileSize: maxImageSize,
  },
});

// const imageMiddleware = upload.single("image");
const imageMiddleware = upload.any();

// const imageMiddleware = upload.array("images", 5);

const unlinkFile = (filename) => {
  const filePath = path.join(__dirname, "../uploads", filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    }
  });
};

module.exports = {
  upload,
  imageMiddleware,
  unlinkFile,
};
