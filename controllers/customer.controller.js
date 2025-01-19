// controllers/customer.controller.js
const Customer = require("../models/customer.model");
const XlsxPopulate = require("xlsx-populate");

exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchBy, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = { [searchBy]: { $regex: search, $options: "i" } };
    }

    const customers = await Customer.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password"); // Exclude password from results

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCustomers: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
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

    // Create a new workbook
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);

    // Styling
    const headerStyle = {
      bold: true,
      fill: "4F81BD",
      fontColor: "ffffff",
      horizontalAlignment: "center",
    };

    const borderStyle = {
      border: true,
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
      cell.value(col.header).style(headerStyle);

      sheet.column(i + 1).width(col.width);
    });

    // Add data with formatting
    customers.forEach((customer, rowIndex) => {
      const rowNum = rowIndex + 2;

      columns.forEach((col, colIndex) => {
        const cell = sheet.cell(rowNum, colIndex + 1);
        let value = customer[col.key];

        // Format specific types of data
        if (col.key === "_id") {
          value = value.toString();
        } else if (col.key === "phone") {
          value = value.join(", ");
        }

        cell.value(value || "").style(borderStyle);

        if (col.style) {
          cell.style(col.style);
        }
      });
    });

    // Add auto-filter to headers
    sheet.range(1, 1, 1, columns.length).autoFilter();

    // Freeze the header row
    sheet.row(1).freeze();

    // Add summary at the bottom
    const lastRow = customers.length + 3;
    sheet.cell(lastRow, 1).value("عدد العملاء").style({ bold: true });

    sheet.cell(lastRow, 2).value(customers.length).style({ bold: true });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `معلومات العملاء${timestamp}.xlsx`;

    // Generate buffer
    const buffer = await workbook.outputAsync();

    // Set headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Send response
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
    // Handle file upload
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

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
