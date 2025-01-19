// models/customer.model.js
const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: [Number], required: true },
    residence: { type: String, required: true },
    sizes: { type: String },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ name: 1 });

module.exports = mongoose.model("Customer", CustomerSchema);
