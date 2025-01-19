// models/account.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AccountSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  isSuperAdmin: { type: Boolean, default: false },
});

// Password hashing middleware
AccountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Verify password
AccountSchema.methods.isPasswordMatch = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Account", AccountSchema);
