const express = require("express");
const {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  getCustomerById,
  importCustomersFromExcel,
  exportCustomersToExcel,
} = require("../controllers/customer.controller");
const {
  verifyToken,
  verifySuperAdmin,
} = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const router = express.Router();

// Error handler for Multer
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds the limit" });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Handle the routes

router.get("/", verifyToken, getCustomers);
router.get("/:id", verifyToken, getCustomerById);
router.post("/", verifyToken, createCustomer);
router.put("/:id", verifyToken, updateCustomer);
router.delete("/:id", verifyToken, deleteCustomer);
router.post(
  "/import",
  verifyToken,
  verifySuperAdmin,
  handleUpload, // Use the error-handling wrapper
  importCustomersFromExcel
);
router.get("/export", verifyToken, verifySuperAdmin, exportCustomersToExcel);

module.exports = router;
