const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: "postgres",
  password: "root",
  host: "localhost",
  port: 5432,
  database: "logistics_system",
});

async function seedUsers() {
  const users = [
    {
      email: "admin@example.com",
      password: "admin123",
      role: "Admin",
      full_name: "Admin User",
    },
    {
      email: "coordinator@example.com",
      password: "coordinator123",
      role: "Coordinator",
      full_name: "Coordinator User",
    },
    {
      email: "driver@example.com",
      password: "driver123",
      role: "Driver",
      full_name: "Driver User",
    },
  ];

  try {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY");

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        "INSERT INTO users (email, password, role, full_name) VALUES ($1, $2, $3, $4)",
        [user.email, hashedPassword, user.role, user.full_name]
      );
      console.log(`Created user: ${user.email}`);
    }
  } catch (err) {
    console.error("Error seeding users:", err);
  } finally {
    pool.end();
  }
}

seedUsers();
