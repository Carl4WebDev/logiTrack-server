const { Pool } = require("pg");
const XLSX = require("xlsx");

// Excel file generator as buffer
const createExcelBuffer = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const insertSampleSummary = async () => {
  const pool = new Pool({
    user: "postgres",
    password: "root",
    host: "localhost",
    port: 5432,
    database: "logistics_system",
  });

  const client = await pool.connect();

  try {
    console.log("Inserting sample summary...");

    // Clear existing data and reset sequence (optional)
    await client.query("TRUNCATE TABLE summary RESTART IDENTITY");

    const sampleSummary = {
      name: "summary Item 1",
      description: "Description of item 1",
      createdAt: new Date("2025-03-07"),
      createdBy: "Jane",
      updatedAt: new Date("2025-03-07"),
      updatedBy: "Admin",
      status: "completed",
      file_name: "summary-sample-1.xlsx",
      file_data: createExcelBuffer([
        { Column1: "Value1", Column2: "Value2" },
        { Column1: "Value3", Column2: "Value4" },
      ]),
    };

    const queryText = `
      INSERT INTO summary (
        name, description, 
        created_at, created_by, 
        updated_at, updated_by, 
        status, file_name, file_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const queryValues = [
      sampleSummary.name,
      sampleSummary.description,
      sampleSummary.createdAt,
      sampleSummary.createdBy,
      sampleSummary.updatedAt,
      sampleSummary.updatedBy,
      sampleSummary.status,
      sampleSummary.file_name,
      sampleSummary.file_data,
    ];

    const result = await client.query(queryText, queryValues);
    console.log(
      `✅ Sample summary inserted successfully! ID: ${result.rows[0].id}`
    );
  } catch (err) {
    console.error("❌ Error inserting summary:", err);
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
insertSampleSummary();
