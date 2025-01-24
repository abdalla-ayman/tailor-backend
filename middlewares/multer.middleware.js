const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "..", "uploads"); // Absolute path
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use a fixed filename (e.g., "imported_customers.xlsx")
    cb(null, "imported_customers.xlsx");
  },
});

const upload = multer({
  storage: storage, // Use disk storage
  limits: {
    fileSize: 1 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];
    const allowedExtensions = [".xlsx", ".xls"];

    // Check MIME type
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    }
    // Check file extension as a fallback
    else if (
      allowedExtensions.includes(path.extname(file.originalname).toLowerCase())
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed (.xlsx, .xls)"));
    }
  },
}).single("file");

module.exports = upload;
