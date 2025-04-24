const { Pool } = require("pg");
const XLSX = require("xlsx");

// PostgreSQL connection configuration
const pool = new Pool({
  user: "postgres",
  password: "root",
  host: "localhost",
  port: 5432,
  database: "logistics_system",
});
// Sample data for our Excel file
const sampleData = [
  { ProductID: 101, Name: "Laptop", Price: 999.99, Stock: 45 },
  { ProductID: 102, Name: "Smartphone", Price: 699.99, Stock: 120 },
  { ProductID: 103, Name: "Tablet", Price: 349.99, Stock: 75 },
];

async function createAndStoreExcel() {
  // Create Excel workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  // Convert to buffer
  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  // Insert into PostgreSQL
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO excel_files (name, type, data, uploaded_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const values = [
      "products_inventory.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      excelBuffer,
      new Date(),
    ];

    const result = await client.query(query, values);
    console.log(`File stored with ID: ${result.rows[0].id}`);
  } catch (error) {
    console.error("Error storing Excel file:", error);
  } finally {
    client.release();
  }
}

createAndStoreExcel();
