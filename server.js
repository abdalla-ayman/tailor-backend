const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan"); // For logging HTTP requests
const helmet = require("helmet"); // For securing HTTP headers

// Load environment variables
dotenv.config();

// Import routes
const accountRoutes = require("./routes/account.routes");
const customerRoutes = require("./routes/customer.routes");
const orderRoutes = require("./routes/order.routes");

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Secure HTTP headers
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(morgan("dev")); // Log HTTP requests in development mode

// Routes
app.use("/api", accountRoutes); // Prefix all account routes with /api/accounts
app.use("/api/customers", customerRoutes); // Prefix all customer routes with /api/customers
app.use("/api/orders", orderRoutes); // Prefix all order routes with /api/orders

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
    process.exit(1); // Exit the process if the connection fails
  }
};

// Connect to MongoDB
connectDB();

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
