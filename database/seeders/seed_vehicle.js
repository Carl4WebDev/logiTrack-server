const { Pool } = require("pg");

async function seedVehicles() {
  const pool = new Pool({
    user: "postgres",
    password: "root",
    host: "localhost",
    port: 5432,
    database: "logistics_system",
  });

  const client = await pool.connect();

  try {
    console.log("Seeding vehicles data...");

    // Clear existing data
    await client.query("TRUNCATE TABLE vehicles RESTART IDENTITY");
    console.log("Cleared existing vehicles data");

    // Insert sample data
    const sampleVehicles = [
      {
        type: "Truck",
        plateNumber: "ABC-1234",
        status: "Available",
      },
      {
        type: "Van",
        plateNumber: "XYZ-5678",
        status: "In Use",
      },
      {
        type: "Pickup",
        plateNumber: "LMN-9012",
        status: "Maintenance",
      },
    ];

    for (const vehicle of sampleVehicles) {
      await client.query(
        `INSERT INTO vehicles (type, plate_number, status) 
         VALUES ($1, $2, $3) 
         RETURNING id, type, plate_number, status`,
        [vehicle.type, vehicle.plateNumber, vehicle.status]
      );
    }

    console.log("Successfully seeded vehicles table");

    const { rows } = await client.query(
      "SELECT id, type, plate_number, status FROM vehicles"
    );
    console.table(rows);
  } catch (error) {
    console.error("Error seeding vehicles:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedVehicles();
