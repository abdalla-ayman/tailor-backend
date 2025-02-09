const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Define constants for status values
const ORDER_STATUSES = {
  PENDING: "pending", // Not started yet
  IN_PROGRESS: "in_progress", // Working on the order
  COMPLETED: "completed", // Finished but not collected
  DELIVERED: "delivered", // Customer collected the order
};

const ITEM_STATUSES = {
  PENDING: "pending", // Not started yet
  IN_PROGRESS: "in_progress", // Currently being worked on
  COMPLETED: "completed", // Item is finished
};

const DRESS_TYPES = {
  JALABYA: "jalabya",
  ARAGI: "aragi",
  PANTS: "pants",
  ALALLA: "alalla",
};

// Schema for individual items in the order
const OrderItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: Object.values(DRESS_TYPES),
  },
  fabric: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(ITEM_STATUSES),
    default: ITEM_STATUSES.PENDING,
  },
});

// Main Order Schema
const OrderSchema = new mongoose.Schema(
  {
    _id: { type: Number }, // Auto-incremental ID
    customerId: {
      type: Number,
      ref: "Customer",
      required: true,
    },
    accountId: {
      type: Number,
      ref: "Account", // Assuming you have an Account model
      required: true,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
    },
    items: [OrderItemSchema],
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Auto-increment plugin configuration
OrderSchema.plugin(AutoIncrement, {
  id: "order_counter",
  inc_field: "_id",
});

// Pre-save middleware to update order status based on items
OrderSchema.pre("save", function (next) {
  if (!this.items || this.items.length === 0) return next();

  if (this.status === ORDER_STATUSES.DELIVERED) return next(); // Don't modify delivered orders

  const allItemsCompleted = this.items.every(
    (item) => item.status === ITEM_STATUSES.COMPLETED
  );

  if (allItemsCompleted) {
    this.status = ORDER_STATUSES.COMPLETED;
  } else if (
    this.items.some((item) => item.status === ITEM_STATUSES.IN_PROGRESS)
  ) {
    this.status = ORDER_STATUSES.IN_PROGRESS;
  } else {
    this.status = ORDER_STATUSES.PENDING;
  }

  next();
});

OrderSchema.index({ accountId: 1, customerId: 1, status: 1 }); // Primary filter index
OrderSchema.index({ accountId: 1, createdAt: -1 }); // For sorting orders by date
OrderSchema.index({ status: 1 }); // For filtering orders by status

// Export constants with the model for easy access
const Order = mongoose.model("Order", OrderSchema);
Order.STATUSES = ORDER_STATUSES;
Order.ITEM_STATUSES = ITEM_STATUSES;
Order.DRESS_TYPES = DRESS_TYPES;

module.exports = Order;
