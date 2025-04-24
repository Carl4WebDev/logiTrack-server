const { Pool } = require("pg");

async function seedDrivers() {
  const pool = new Pool({
    user: "postgres",
    password: "root",
    host: "localhost",
    port: 5432,
    database: "logistics_system",
  });

  const client = await pool.connect();

  try {
    console.log("Seeding drivers data...");

    // Clear existing data
    await client.query("TRUNCATE TABLE drivers RESTART IDENTITY");
    console.log("Cleared existing drivers data");

    // Insert sample data
    const sampleDrivers = [
      {
        name: "Alex Turner",
        license_number: "D12345",
        vehicle_assigned: "Truck 1",
        status: "Active",
      },
      {
        name: "Jamie Smith",
        license_number: "D67890",
        vehicle_assigned: "Van 2",
        status: "Active",
      },
      {
        name: "Taylor Brown",
        license_number: "D13579",
        vehicle_assigned: "Pickup 3",
        status: "Inactive",
      },
    ];

    for (const driver of sampleDrivers) {
      await client.query(
        `INSERT INTO drivers (name, license_number, vehicle_assigned, status)
         VALUES ($1, $2, $3, $4)`,
        [
          driver.name,
          driver.licenseNumber,
          driver.vehicleAssigned,
          driver.status,
        ]
      );
    }

    console.log("Successfully seeded drivers table");

    // Verify the data
    const { rows } = await client.query("SELECT * FROM drivers");
    console.table(rows);
  } catch (error) {
    console.error("Error seeding drivers:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDrivers();
