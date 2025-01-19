// routes/customer.routes.js
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

router.get("/customers", verifyToken, getCustomers);
router.post("/customers", verifyToken, createCustomer);
router.put("/customers/:id", verifyToken, updateCustomer);
router.delete("/customers/:id", verifyToken, deleteCustomer);
router.post(
  "/customers/import",
  verifyToken,
  verifySuperAdmin,
  upload,
  importCustomersFromExcel
);
router.get(
  "/customers/export",
  verifyToken,
  verifySuperAdmin,
  exportCustomersToExcel
);
module.exports = router;
