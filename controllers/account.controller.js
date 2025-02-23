// controllers/account.controller.js
const Account = require("../models/account.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const ALLOWED_SEARCH_FIELDS = ["name", "username"]; // Fields allowed for searching

exports.getAccounts = async (req, res) => {
  try {
    let {
      page = DEFAULT_PAGE,
      rowsPerPage = DEFAULT_LIMIT,
      searchField,
      searchQuery,
      isSuperAdmin, // New parameter for filtering by isSuperAdmin
    } = req.query;

    // Validate and parse page and limit
    page = parseInt(page);
    rowsPerPage = parseInt(rowsPerPage);
    if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
    if (isNaN(rowsPerPage) || rowsPerPage < 1) rowsPerPage = DEFAULT_LIMIT;

    const skip = (page - 1) * rowsPerPage;

    // Build the query
    let query = {};

    // Add search query if searchField and searchQuery are provided
    if (
      searchQuery &&
      searchField &&
      ALLOWED_SEARCH_FIELDS.includes(searchField)
    ) {
      const searchQueryString = searchQuery.toString();
      query[searchField] = { $regex: searchQueryString, $options: "i" };
    } else if (
      searchField === "_id" &&
      searchQuery.trim() !== "" &&
      !isNaN(searchQuery)
    ) {
      query = { _id: parseInt(searchQuery) };
    }

    if (isSuperAdmin !== undefined && isSuperAdmin !== "all") {
      // Add isSuperAdmin filter if provided
      query.isSuperAdmin = isSuperAdmin === "true"; // Convert string to boolean
    }

    // Fetch accounts
    const accounts = await Account.find(query)
      .skip(skip)
      .limit(rowsPerPage)
      .select("-password"); // Exclude password from results

    // Get total count of matching accounts
    const total = await Account.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / rowsPerPage);

    // Send response
    res.json({
      accounts,
      currentPage: page,
      totalPages,
      totalAccounts: total,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res
      .status(500)
      .json({ message: "Error fetching accounts", error: error.message });
  }
};
//get account from token
exports.getAccountFromToken = async (req, res) => {
  const user = req.user;
  res.json(user);
};

// User login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const account = await Account.findOne({ username });
    console.log(account);
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
    const currentUser = req.user;
    if (currentUser._id === req.params.id || currentUser.isSuperAdmin) {
      await Account.findByIdAndDelete(req.params.id);
      return res.json({ message: "Account deleted" });
    }
    return res.sendStatus(403);
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error });
  }
};
