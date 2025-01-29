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
    } else if (searchQuery == "_id") {
      query = { _id: parseInt(searchField) };
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
    const customers = await Customer.find();

    if (customers.length === 0) {
      return res.status(404).json({ message: "No customers found to export" });
    }

    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);

    const headerStyle = {
      bold: true,
      fill: "4F81BD",
      fontColor: "ffffff",
      horizontalAlignment: "center",
    };

    const borderStyle = {
      border: true,
    };

    // Updated columns definition with new measurement fields
    const columns = [
      { header: "الرقم التعريفي", key: "_id", width: 15 },
      { header: "الاسم", key: "name", width: 20 },
      { header: "الهاتف", key: "phone", width: 25 },
      { header: "السكن", key: "residence", width: 25 },
      { header: "الطول", key: "length", width: 15 },
      { header: "عرض الكتف", key: "shouldersWidth", width: 15 },
      { header: "طول الكم", key: "sleeveLength", width: 15 },
      { header: "عرض الكم الاعلى", key: "upperSleeveWidth", width: 15 },
      { header: "عرض الكم الأسفل", key: "lowerSleeveWidth", width: 15 },
      { header: "الجمبات فوق", key: "upperSides", width: 15 },
      { header: "الجمبات تحت", key: "lowerSides", width: 15 },
      { header: "طول السروال", key: "pantsLength", width: 15 },
      { header: "عرض السروال", key: "pantsWidth", width: 15 },
      { header: "ملاحظات", key: "notes", width: 30 },
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

        // Special formatting for specific fields
        if (col.key === "_id") {
          value = value.toString();
        } else if (col.key === "phone" && Array.isArray(value)) {
          value = value.join(", ");
        } else if (
          [
            "length",
            "shouldersWidth",
            "sleeveLength",
            "upperSleeveWidth",
            "lowerSleeveWidth",
            "upperSides",
            "lowerSides",
            "pantsLength",
            "pantsWidth",
          ].includes(col.key)
        ) {
          // Format numbers with 1 decimal place if they exist
          value = value ? Number(value).toFixed(1) : "";
        }

        cell.value(value || "").style(borderStyle);
      });
    });

    sheet.range(1, 1, 1, columns.length).autoFilter();
    sheet.freezePanes(2, 1);

    // Add summary
    const lastRow = customers.length + 3;
    sheet.cell(lastRow, 1).value("عدد العملاء").style({ bold: true });
    sheet.cell(lastRow, 2).value(customers.length).style({ bold: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `معلومات العملاء_${timestamp}.xlsx`;

    const buffer = await workbook.outputAsync();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
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

    const workbook = await XlsxPopulate.fromDataAsync(req.file.buffer);
    const sheet = workbook.sheet(0);

    // Updated expected headers mapping
    const expectedHeaders = {
      الاسم: "name",
      الهاتف: "phone",
      السكن: "residence",
      الطول: "length",
      "عرض الكتف": "shouldersWidth",
      "طول الكم": "sleeveLength",
      "عرض الكم الاعلى": "upperSleeveWidth",
      "عرض الكم الأسفل": "lowerSleeveWidth",
      "الجمبات فوق": "upperSides",
      "الجمبات تحت": "lowerSides",
      "طول السروال": "pantsLength",
      "عرض السروال": "pantsWidth",
      ملاحظات: "notes",
    };

    // Validate headers
    const headerRow = sheet.row(1);
    const headers = headerRow.cells().map((cell) => cell.value());

    const requiredHeaders = ["الاسم", "الهاتف", "السكن"]; // Only these are required
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        return res.status(400).json({
          message: `Missing required column: ${header}`,
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
        if (row.cells().every((cell) => !cell.value())) continue;

        const customer = {
          name: row.cell(columnIndexes.name + 1).value(),
          phone: row.cell(columnIndexes.phone + 1).value(),
          residence: row.cell(columnIndexes.residence + 1).value(),
          createdBy: req.user.name,
        };

        // Add measurement fields if they exist in the Excel
        for (const [arabicHeader, englishKey] of Object.entries(
          expectedHeaders
        )) {
          if (
            englishKey !== "name" &&
            englishKey !== "phone" &&
            englishKey !== "residence" &&
            columnIndexes[englishKey] !== undefined
          ) {
            const value = row.cell(columnIndexes[englishKey] + 1).value();
            if (value !== null && value !== undefined) {
              if (englishKey === "notes") {
                customer[englishKey] = value.toString();
              } else if (englishKey !== "phone") {
                // Convert measurements to numbers
                customer[englishKey] = Number(value) || null;
              }
            }
          }
        }

        // Validate required fields
        if (!customer.name) {
          throw new Error("Name is required");
        }

        // Process phone numbers
        if (typeof customer.phone === "string") {
          customer.phone = customer.phone.split(",").map((p) => p.trim());
        } else if (!Array.isArray(customer.phone)) {
          customer.phone = [customer.phone.toString()];
        }

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
