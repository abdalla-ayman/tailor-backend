// controllers/account.controller.js
const Account = require("../models/account.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchBy, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query =
        searchBy === "name"
          ? { name: { $regex: search, $options: "i" } }
          : { _id: { $regex: search, $options: "i" } };
    }

    const accounts = await Account.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password"); // Exclude password from results

    const total = await Account.countDocuments(query);

    res.json({
      accounts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalAccounts: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching accounts", error });
  }
};

// User login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const account = await Account.findOne({ username });
    if (!account || !(await account.isPasswordMatch(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: account._id, isSuperAdmin: account.isSuperAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token, name: account.name, isSuperAdmin: account.isSuperAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

// Create a new account (Super Admin Only)
exports.createAccount = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: Only super admins can create accounts." });
    }
    const account = await Account.create(req.body);
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ message: "Error creating account", error });
  }
};

// Update an account
exports.updateAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    const updateData = req.body;

    // Check if the account exists
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Only allow super admins to update the `isSuperAdmin` flag
    if (updateData.isSuperAdmin !== undefined) {
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({
          message:
            "Forbidden: Only super admins can update the isSuperAdmin flag.",
        });
      }
      account.isSuperAdmin = updateData.isSuperAdmin; // Allow super admin to update this field
    }

    // Allow account to update their own username, password, and name
    if (req.user.id === accountId || req.user.isSuperAdmin) {
      if (updateData.username) account.username = updateData.username;
      if (updateData.name) account.name = updateData.name;

      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        account.password = hashedPassword;
      }
    } else {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own account." });
    }

    // Save the updated account
    await account.save();
    res.json({ message: "Account updated successfully", account });
  } catch (error) {
    res.status(500).json({ message: "Error updating account", error });
  }
};

// Delete an account
exports.deleteAccount = async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: "Account deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error });
  }
};
