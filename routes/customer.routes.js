const express = require("express");
const {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  getCustomerById,

  exportCustomersToExcel,
} = require("../controllers/customer.controller");
const {
  verifyToken,
  verifySuperAdmin,
} = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const router = express.Router();

// Handle the routes

router.get("/export", verifyToken, verifySuperAdmin, exportCustomersToExcel);
router.get("/", verifyToken, getCustomers);
router.get("/:id", verifyToken, getCustomerById);
router.post("/", verifyToken, createCustomer);
router.put("/:id", verifyToken, updateCustomer);
router.delete("/:id", verifyToken, deleteCustomer);

module.exports = router;
