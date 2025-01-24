// controllers/customer.controller.js
const Customer = require("../models/customer.model");
const XlsxPopulate = require("xlsx-populate");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const ALLOWED_SEARCH_FIELDS = ["name", "phone", "residence"]; // Fields allowed for searching

exports.getCustomers = async (req, res) => {
  try {
    let {
      page = DEFAULT_PAGE,
      rowsPerPage = DEFAULT_LIMIT,
      searchField,
      searchQuery,
    } = req.query;

    // Validate and parse page and limit
    page = parseInt(page);
    rowsPerPage = parseInt(rowsPerPage);
    if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
    if (isNaN(rowsPerPage) || rowsPerPage < 1) rowsPerPage = DEFAULT_LIMIT;

    const skip = (page - 1) * rowsPerPage;

    // Build the query
    let query = {};
    if (
      searchQuery &&
      searchField &&
      ALLOWED_SEARCH_FIELDS.includes(searchField)
    ) {
      if (searchField === "phone") {
        query[searchField] = {
          $elemMatch: { $toString: { $eq: searchQuery.toString() } },
        };
      } else {
        query[searchField] = { $regex: searchQuery, $options: "i" };
      }
    }

    // Fetch customers
    const customers = await Customer.find(query).skip(skip).limit(rowsPerPage);

    // Get total count of matching customers
    const total = await Customer.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / rowsPerPage);

    // Send response
    res.json({
      customers,
      currentPage: page,
      totalPages,
      totalCustomers: total,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res
      .status(500)
      .json({ message: "Error fetching customers", error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name } = req.user; // Admin's name from token
    const customer = await Customer.create({ ...req.body, createdBy: name });
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: "Error creating customer", error });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name } = req.user; // Admin's name from token
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: name },
      { new: true }
    );
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: "Error updating customer", error });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting customer", error });
  }
};

exports.exportCustomersToExcel = async (req, res) => {
  try {
    // Fetch customers with sorting
    const customers = await Customer.find();

    // Check if there are customers to export
    if (customers.length === 0) {
      return res.status(404).json({ message: "No customers found to export" });
    }

    // Create a new workbook
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);

    // Styling
    const headerStyle = {
      bold: true,
      fill: "4F81BD", // Blue background for headers
      fontColor: "ffffff", // White text color
      horizontalAlignment: "center", // Center-align headers
    };

    const borderStyle = {
      border: true, // Add borders to all cells
    };

    // Define columns with their properties
    const columns = [
      { header: "الرقم التعريفي", key: "_id", width: 24 },
      { header: "الاسم", key: "name", width: 20 },
      { header: "الهاتف", key: "phone", width: 30 },
      { header: "السكن", key: "residence", width: 30 },
      { header: "المقاسات", key: "sizes", width: 30 },
    ];

    // Add headers and set column widths
    columns.forEach((col, i) => {
      const cell = sheet.cell(1, i + 1);
      cell.value(col.header).style(headerStyle); // Apply header style
      sheet.column(i + 1).width(col.width); // Set column width
    });

    // Add data with formatting
    customers.forEach((customer, rowIndex) => {
      const rowNum = rowIndex + 2; // Start from row 2 (row 1 is headers)

      columns.forEach((col, colIndex) => {
        const cell = sheet.cell(rowNum, colIndex + 1);
        let value = customer[col.key];

        // Format specific types of data
        if (col.key === "_id") {
          value = value.toString(); // Convert ObjectId to string
        } else if (col.key === "phone" && Array.isArray(value)) {
          value = value.join(", "); // Join phone numbers with a comma
        }

        cell.value(value || "").style(borderStyle); // Set cell value and apply border style
      });
    });

    // Add auto-filter to headers
    sheet.range(1, 1, 1, columns.length).autoFilter();

    // Freeze the header row
    sheet.freezePanes(2, 1); // Freeze the first row (header row)

    // Add summary at the bottom
    const lastRow = customers.length + 3; // Position for summary
    sheet.cell(lastRow, 1).value("عدد العملاء").style({ bold: true }); // Add summary label
    sheet.cell(lastRow, 2).value(customers.length).style({ bold: true }); // Add total count

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `معلومات العملاء_${timestamp}.xlsx`;

    // Generate buffer
    const buffer = await workbook.outputAsync();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Encode the filename for the Content-Disposition header
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedFilename}`
    );

    // Send the Excel file as a response
    res.send(buffer);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      message: "Error exporting customers",
      error: error.message,
    });
  }
};

exports.importCustomersFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    // Load workbook from buffer
    const workbook = await XlsxPopulate.fromDataAsync(req.file.buffer);
    const sheet = workbook.sheet(0);

    // Define expected headers and their corresponding keys
    const expectedHeaders = {
      الاسم: "name",
      الهاتف: "phone",
      السكن: "residence",
      المقاسات: "sizes",
    };

    // Validate headers
    const headerRow = sheet.row(1);
    const headers = headerRow.cells().map((cell) => cell.value());

    for (const [arabicHeader, key] of Object.entries(expectedHeaders)) {
      if (!headers.includes(arabicHeader)) {
        return res.status(400).json({
          message: `Missing required column: ${arabicHeader}`,
        });
      }
    }

    // Get column indexes
    const columnIndexes = {};
    headers.forEach((header, index) => {
      if (expectedHeaders[header]) {
        columnIndexes[expectedHeaders[header]] = index;
      }
    });

    // Process data rows
    const customers = [];
    const errors = [];
    const usedRange = sheet.usedRange();
    const rowCount = usedRange.endCell().rowNumber();

    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      const row = sheet.row(rowNumber);

      try {
        // Skip empty rows
        if (row.cells().every((cell) => !cell.value())) continue;

        const customer = {
          name: row.cell(columnIndexes.name + 1).value(),
          phone: row.cell(columnIndexes.phone + 1).value(),
          residence: row.cell(columnIndexes.residence + 1).value(),
          sizes: row.cell(columnIndexes.sizes + 1).value(),
          createdBy: req.user.name,
        };

        // Validate required fields
        if (!customer.name) {
          throw new Error("Name is required");
        }

        // Process phone numbers (convert to array if string)
        if (typeof customer.phone === "string") {
          customer.phone = customer.phone.split(",").map((p) => p.trim());
        } else if (!Array.isArray(customer.phone)) {
          customer.phone = [customer.phone.toString()];
        }

        // Validate phone numbers
        customer.phone = customer.phone.filter((p) => p && p.length > 0);
        if (customer.phone.length === 0) {
          throw new Error("At least one valid phone number is required");
        }

        customers.push(customer);
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation errors in Excel file",
        errors,
      });
    }

    // Save customers to database
    const result = await Customer.insertMany(customers, { ordered: false });

    res.json({
      message: "Customers imported successfully",
      imported: result.length,
      total: customers.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      message: "Error importing customers",
      error: error.message,
    });
  }
};
