const multer = require("multer");

// Configure multer for Excel files
const upload = multer({
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
}).single("file");

module.exports = upload;
