// scripts/createSuperAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const Account = require("./models/account.model");
const bcrypt = require("bcryptjs");

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB using environment variables
    await mongoose.connect("mongodb://admin:password@localhost:27017/admin", {
      authSource: "admin",
    });

    const superAdmin = {
      username: process.env.SUPER_ADMIN_USERNAME || "admin",
      password: process.env.SUPER_ADMIN_PASSWORD || "password",
      name: "Super Admin",
      isSuperAdmin: true,
    };

    // Check if super admin exists
    const existingSuperAdmin = await Account.findOne({ isSuperAdmin: true });
    if (existingSuperAdmin) {
      console.log("Super admin already exists");
      process.exit(0);
    }

    // Create super admin account
    const account = await Account.create(superAdmin);
    console.log("Super admin created successfully:", account.username);
  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createSuperAdmin();
