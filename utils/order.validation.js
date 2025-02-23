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

const validateOrderData = (data) => {
  const errors = [];

  // Required fields validation
  const requiredFields = ["customer", "account", "amountDue", "items"];
  requiredFields.forEach((field) => {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // AmountDue validation
  if (typeof data.amountDue !== "number" || data.amountDue < 0) {
    errors.push("amountDue must be a non-negative number");
  }

  // Items validation
  if (Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      // Validate each item
      if (!item.type || !Object.values(DRESS_TYPES).includes(item.type)) {
        errors.push(`Invalid dress type for item ${index + 1}`);
      }

      if (typeof item.count !== "number" || item.count < 1) {
        errors.push(`Invalid count for item ${index + 1}`);
      }
    });
  } else {
    errors.push("items must be an array");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const buildOrderQuery = ({
  status,
  searchField,
  searchQuery,
  page = 1,
  limit = 10,
  account,
}) => {
  const query = {};
  let customerNameFilter = "";

  // Add filters if provided
  if (status && Object.values(ORDER_STATUSES).includes(status)) {
    query.status = status;
  }

  if (!account.isSuperAdmin) {
    query.account = parseInt(account._id);
  }

  if (searchField == "_id" && searchQuery) {
    query._id = parseInt(searchQuery);
  }

  if (searchField == "customerName") {
    customerNameFilter = searchQuery;
  }

  // Return both query and pagination options
  return {
    query,
    customerNameFilter,
    skip: (page - 1) * limit,
    limit: parseInt(limit),
  };
};

module.exports = {
  validateOrderData,
  buildOrderQuery,
};
