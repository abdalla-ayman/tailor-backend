const express = require("express");
const {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
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

router.get("/customers", verifyToken, getCustomers);
router.post("/customers", verifyToken, createCustomer);
router.put("/customers/:id", verifyToken, updateCustomer);
router.delete("/customers/:id", verifyToken, deleteCustomer);
router.post(
  "/customers/import",
  verifyToken,
  verifySuperAdmin,
  handleUpload, // Use the error-handling wrapper
  importCustomersFromExcel
);
router.get(
  "/customers/export",
  verifyToken,
  verifySuperAdmin,
  exportCustomersToExcel
);

module.exports = router;
