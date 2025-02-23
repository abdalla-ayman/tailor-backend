const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Common measurements for upper garments (Jalabya and Aragi)
const upperGarmentMeasurements = {
  length: { type: Number },
  shouldersWidth: { type: Number },
  sleeveLength: { type: Number },
  upperSleeveWidth: { type: Number },
  lowerSleeveWidth: { type: Number },
  upperSides: { type: Number },
  lowerSides: { type: Number },
};

// Pants measurements
const pantsGarmentMeasurements = {
  pantsLength: { type: Number },
  pantsWidth: { type: Number },
};

const CustomerSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String, required: true },
    phone: { type: [String], required: true },
    residence: { type: String, required: true },

    // Measurements grouped by dress type
    measurements: {
      jalabya: { ...upperGarmentMeasurements, notes: { type: String } },
      aragi: { ...upperGarmentMeasurements, notes: { type: String } },
      pants: { ...pantsGarmentMeasurements, notes: { type: String } },
      alalla: {
        ...upperGarmentMeasurements,
        ...pantsGarmentMeasurements,
        notes: { type: String },
      },
    },

    createdBy: { type: String, required: true },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Indexes
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 1 });

// Auto increment plugin
CustomerSchema.plugin(AutoIncrement, {
  id: "customer_counter",
  inc_field: "_id",
});

module.exports = mongoose.model("Customer", CustomerSchema);
