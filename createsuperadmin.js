// scripts/createSuperAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const Account = require("./models/account.model");
const bcrypt = require("bcryptjs");

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      "mongodb://admin:password@localhost:27017/mobile-application?authSource=admin",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    // Check if any super admin exists
    const existingSuperAdmin = await Account.findOne({ isSuperAdmin: true });
    if (existingSuperAdmin) {
      console.log("Super admin already exists");
      process.exit(0);
    }

    // Super admin credentials - you might want to modify these or read from env
    const superAdmin = {
      username: process.env.SUPER_ADMIN_USERNAME || "admin",
      password: process.env.SUPER_ADMIN_PASSWORD || "password",
      name: "Super Admin",
      isSuperAdmin: true,
    };

    // Create the super admin account
    const account = await Account.create(superAdmin);
    console.log("Super admin account created successfully:", {
      id: account._id,
      username: account.username,
      name: account.name,
    });
  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the function
createSuperAdmin();
