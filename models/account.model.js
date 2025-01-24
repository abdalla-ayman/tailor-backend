const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const bcrypt = require("bcryptjs");

const AccountSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
    },
    username: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    isSuperAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Add timestamps for createdAt and updatedAt
    _id: false, // Disable default _id to use auto-incremented _id
  }
);

// Indexes for frequently queried fields
AccountSchema.index({ username: 1 });
AccountSchema.index({ name: 1 });

// Password hashing middleware
AccountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Verify password method
AccountSchema.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Auto-increment plugin for _id
AccountSchema.plugin(AutoIncrement, {
  id: "account_counter",
  inc_field: "_id",
});

module.exports = mongoose.model("Account", AccountSchema);
