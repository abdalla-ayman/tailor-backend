// routes/account.routes.js
const express = require("express");
const {
  login,
  createAccount,
  deleteAccount,
  updateAccount,
  getAccounts,
} = require("../controllers/account.controller");
const {
  verifyToken,
  verifySuperAdmin,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Login route
router.get("/accounts", verifyToken, verifySuperAdmin, getAccounts);

// Login route
router.post("/login", login);

//update account
router.patch("/accounts/:id", verifyToken, updateAccount);

// Only super admin can create accounts
router.post("/accounts", verifyToken, verifySuperAdmin, createAccount);

// Delete account (accessible by authenticated users, could restrict to super admin if needed)
router.delete("/accounts/:id", verifyToken, verifySuperAdmin, deleteAccount);

module.exports = router;
