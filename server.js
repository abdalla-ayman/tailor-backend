// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const accountRoutes = require("./routes/account.routes");
const customerRoutes = require("./routes/customer.routes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(accountRoutes);
app.use(customerRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connection Successful");
  } catch (error) {
    console.error("MongoDB Connection Failed:", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
    });
    process.exit(1);
  }
};

connectDB();

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
