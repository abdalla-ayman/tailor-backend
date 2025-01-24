// models/customer.model.js
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const CustomerSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String, required: true },
    phone: { type: [String], required: true },
    residence: { type: String, required: true },
    sizes: { type: String },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true, _id: false }
);

CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 1 });

CustomerSchema.plugin(AutoIncrement, {
  id: "customer_counter",
  inc_field: "_id",
});

module.exports = mongoose.model("Customer", CustomerSchema);
