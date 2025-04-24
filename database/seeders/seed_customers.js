const { Pool } = require("pg");
const XLSX = require("xlsx");

// Excel file generator as buffer
const createExcelBuffer = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const insertSampleCustomers = async () => {
  const pool = new Pool({
    user: "postgres",
    password: "root",
    host: "localhost",
    port: 5432,
    database: "logistics_system",
  });

  const client = await pool.connect();

  try {
    console.log("Inserting sample shipment...");

    // Clear existing data and reset sequence (optional)
    await client.query("TRUNCATE TABLE customers RESTART IDENTITY");

    const sampleCustomers = {
      name: "Customer Item 1",
      description: "Description of item 1",
      createdAt: new Date("2025-03-07"),
      createdBy: "Jane",
      updatedAt: new Date("2025-03-07"),
      updatedBy: "Admin",
      status: "completed",
      file_name: "customers-sample-1.xlsx",
      file_data: createExcelBuffer([
        { Column1: "Value1", Column2: "Value2" },
        { Column1: "Value3", Column2: "Value4" },
      ]),
    };

    const queryText = `
      INSERT INTO customers (
        name, description, 
        created_at, created_by, 
        updated_at, updated_by, 
        status, file_name, file_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const queryValues = [
      sampleCustomers.name,
      sampleCustomers.description,
      sampleCustomers.createdAt,
      sampleCustomers.createdBy,
      sampleCustomers.updatedAt,
      sampleCustomers.updatedBy,
      sampleCustomers.status,
      sampleCustomers.file_name,
      sampleCustomers.file_data,
    ];

    const result = await client.query(queryText, queryValues);
    console.log(
      `✅ Sample shipment inserted successfully! ID: ${result.rows[0].id}`
    );
  } catch (err) {
    console.error("❌ Error inserting shipment:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      position: err.position,
      stack: err.stack,
    });
  } finally {
    client.release();
    await pool.end();
  }
};

// Run it
insertSampleCustomers();
