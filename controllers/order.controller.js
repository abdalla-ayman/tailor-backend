const Order = require("../models/Order");
const Customer = require("../models/Customer");

// Helper function to check measurements
const hasRequiredMeasurements = (customer, items) => {
  return items.every((item) => customer.measurements[item.type]);
};

// Create Order Controller
exports.createOrder = async (req, res) => {
  try {
    const { customerId, accountId, amountDue, items, customerData } = req.body;

    let customer;

    if (customerId) {
      // Fetch existing customer
      customer = await Customer.findById(customerId);
      if (!customer)
        return res.status(404).json({ message: "Customer not found" });
    } else {
      // Validate new customer data
      if (
        !customerData ||
        !customerData.name ||
        !customerData.phone ||
        !customerData.measurements
      ) {
        return res
          .status(400)
          .json({ message: "New customer data is incomplete" });
      }

      // Check if customer has measurements for ordered items
      if (!hasRequiredMeasurements(customerData, items)) {
        return res
          .status(400)
          .json({ message: "Missing required measurements for ordered items" });
      }

      // Create new customer
      customer = await Customer.create({
        ...customerData,
        createdBy: req.user.id,
      });
    }

    // Create order
    const order = await Order.create({
      customerId: customer._id,
      accountId,
      amountDue,
      items,
      status: Order.STATUSES.PENDING,
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update Order Controller
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, amountDue, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Prevent updates to delivered orders
    if (order.status === Order.STATUSES.DELIVERED) {
      return res
        .status(400)
        .json({ message: "Cannot update a delivered order" });
    }

    // Prevent changing customerId
    if (req.body.customerId && req.body.customerId !== order.customerId) {
      return res.status(400).json({ message: "Customer ID cannot be changed" });
    }

    if (amountDue !== undefined) order.amountDue = amountDue;
    if (status) order.status = status;
    order.items = items;

    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("customerId");

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedOrder)
      return res.status(404).json({ error: "Order not found" });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder)
      return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
