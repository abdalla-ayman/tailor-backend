const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const {
  validateOrderData,
  buildOrderQuery,
} = require("../utils/order.validation");

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate({
        path: "customer",
        select: "name _id measurements",
      })
      .lean();

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const {
      searchField,
      searchQuery,
      status,
      page = 1,
      limit = 10,
    } = req.query;
    const account = req.user; // Assuming this comes from auth middleware

    // Build query with filters
    const {
      query,
      customerNameFilter,
      skip,
      limit: queryLimit,
    } = buildOrderQuery({
      status,
      searchField,
      searchQuery,
      page,
      limit,
      account,
    });

    // Execute query with customer population
    let orders = await Order.find(query)
      .populate({
        path: "customer",
        match: customerNameFilter
          ? { name: new RegExp(customerNameFilter, "i") }
          : undefined, // Case-insensitive search
        select: "name",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(queryLimit);

    // Remove orders where `customer` is `null`
    if (customerNameFilter) {
      orders = orders.filter((order) => order.customer);
    }

    // Get total count for pagination
    const totalOrders = customerNameFilter
      ? orders.length // Adjust count after filtering
      : await Order.countDocuments(query);

    // Return paginated response
    res.json({
      orders,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOrders / queryLimit),
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create Order Controller
exports.createOrder = async (req, res) => {
  try {
    const { customerId, amountDue, items } = req.body;
    const account = req.user._id;
    const data = {
      account,
      customer: customerId,
      amountDue,
      items,
    };

    if (!customerId)
      return res.status(400).json({ message: "missing customer id" });

    const orderValidation = validateOrderData(data);
    if (orderValidation.isValid === false) {
      return res.status(400).json({
        message: "Invalid order data",
        errors: orderValidation.errors,
      });
    }

    // Fetch  customer
    customer = await Customer.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    // Create order
    const order = await Order.create({
      ...data,
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
    const { id } = req.params;
    const { items, amountDue, status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Prevent updates to delivered orders
    if (order.status === Order.STATUSES.DELIVERED) {
      return res
        .status(400)
        .json({ message: "Cannot update a delivered order" });
    }

    if (amountDue !== undefined) order.amountDue = amountDue;
    if (status) order.status = status;
    if (items) order.items = items;

    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
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
