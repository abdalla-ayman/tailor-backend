const Customer = require("../models/customer.model");
const XlsxPopulate = require("xlsx-populate");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const ALLOWED_SEARCH_FIELDS = ["name", "phone", "residence"];

exports.getCustomers = async (req, res) => {
  try {
    let {
      page = DEFAULT_PAGE,
      rowsPerPage = DEFAULT_LIMIT,
      searchField,
      searchQuery,
    } = req.query;

    page = parseInt(page);
    rowsPerPage = parseInt(rowsPerPage);
    if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
    if (isNaN(rowsPerPage) || rowsPerPage < 1) rowsPerPage = DEFAULT_LIMIT;

    const skip = (page - 1) * rowsPerPage;

    let query = {};
    if (
      searchQuery &&
      searchField &&
      ALLOWED_SEARCH_FIELDS.includes(searchField)
    ) {
      if (searchField === "phone") {
        query[searchField] = {
          $elemMatch: { $regex: searchQuery, $options: "i" },
        };
      } else {
        query[searchField] = { $regex: searchQuery, $options: "i" };
      }
    } else if (searchField === "_id") {
      query = { _id: parseInt(searchQuery) };
    }

    const customers = await Customer.find(query).skip(skip).limit(rowsPerPage);
    const total = await Customer.countDocuments(query);
    const totalPages = Math.ceil(total / rowsPerPage);

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

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching customer", error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name } = req.user;
    const customerData = {
      ...req.body,
      createdBy: name,
    };

    // Ensure measurements are properly structured
    if (customerData.measurements) {
      const validDressTypes = ["jalabya", "aragi", "pants", "alalla"];
      validDressTypes.forEach((dressType) => {
        if (customerData.measurements[dressType]) {
          const measurements = customerData.measurements[dressType];
          // Remove any undefined or null values
          Object.keys(measurements).forEach((key) => {
            if (measurements[key] === undefined || measurements[key] === null) {
              delete measurements[key];
            }
          });
        }
      });
    }

    const customer = await Customer.create(customerData);
    res.status(201).json(customer);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating customer", error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name } = req.user;
    const customerData = {
      ...req.body,
      updatedBy: name,
    };

    // Handle measurements updates
    if (customerData.measurements) {
      const validDressTypes = ["jalabya", "aragi", "pants", "alalla"];
      validDressTypes.forEach((dressType) => {
        if (customerData.measurements[dressType]) {
          const measurements = customerData.measurements[dressType];
          Object.keys(measurements).forEach((key) => {
            if (measurements[key] === undefined || measurements[key] === null) {
              delete measurements[key];
            }
          });
        }
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      customerData,
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating customer", error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting customer", error: error.message });
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

    // Define columns for each dress type
    const baseColumns = [
      { header: "الرقم التعريفي", key: "_id", width: 15 },
      { header: "الاسم", key: "name", width: 20 },
      { header: "الهاتف", key: "phone", width: 25 },
      { header: "السكن", key: "residence", width: 25 },
    ];

    const dressTypes = ["jalabya", "aragi", "pants", "alalla"];
    let currentColumn = 5;

    // Add headers for each dress type
    dressTypes.forEach((dressType) => {
      sheet
        .cell(1, currentColumn)
        .value(`قياسات ${dressType}`)
        .style(headerStyle);

      const measurements =
        dressType === "pants"
          ? [
              { header: "طول السروال", key: "pantsLength" },
              { header: "عرض السروال", key: "pantsWidth" },
            ]
          : [
              { header: "الطول", key: "length" },
              { header: "عرض الكتف", key: "shouldersWidth" },
              { header: "طول الكم", key: "sleeveLength" },
              { header: "عرض الكم الاعلى", key: "upperSleeveWidth" },
              { header: "عرض الكم الأسفل", key: "lowerSleeveWidth" },
              { header: "الجمبات فوق", key: "upperSides" },
              { header: "الجمبات تحت", key: "lowerSides" },
            ];

      measurements.forEach((measurement, index) => {
        sheet
          .cell(2, currentColumn + index)
          .value(measurement.header)
          .style(headerStyle);
      });

      if (dressType === "alalla") {
        const pantsHeaders = [
          { header: "طول السروال", key: "pantsLength" },
          { header: "عرض السروال", key: "pantsWidth" },
        ];
        pantsHeaders.forEach((header, index) => {
          sheet
            .cell(2, currentColumn + measurements.length + index)
            .value(header.header)
            .style(headerStyle);
        });
      }

      currentColumn += measurements.length + (dressType === "alalla" ? 2 : 0);
    });

    // Add data
    customers.forEach((customer, rowIndex) => {
      const rowNum = rowIndex + 3;

      // Base information
      baseColumns.forEach((col, colIndex) => {
        let value = customer[col.key];
        if (col.key === "phone" && Array.isArray(value)) {
          value = value.join(", ");
        }
        sheet
          .cell(rowNum, colIndex + 1)
          .value(value)
          .style(borderStyle);
      });

      // Add measurements for each dress type
      let colOffset = baseColumns.length + 1;
      dressTypes.forEach((dressType) => {
        if (customer.measurements && customer.measurements[dressType]) {
          const measurements = customer.measurements[dressType];
          Object.values(measurements).forEach((value, index) => {
            if (typeof value === "number") {
              sheet
                .cell(rowNum, colOffset + index)
                .value(Number(value).toFixed(1))
                .style(borderStyle);
            }
          });
        }
        colOffset += dressType === "pants" ? 2 : dressType === "alalla" ? 9 : 7;
      });
    });

    // Formatting
    sheet.freezePanes(3, 1);

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
