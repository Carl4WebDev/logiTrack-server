require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const XLSX = require("xlsx");

const bcrypt = require("bcrypt");

const app = express();
const cors = require("cors"); // Install with: npm install cors
app.use(cors()); // Add this before your routes

app.use(express.json({ limit: "50mb" })); // For handling file data

const upload = multer({ storage: multer.memoryStorage() });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  // For production (Render) you might need SSL:
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Middleware
app.use(express.json());

// Routes
app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id,full_name, email, role  
      FROM users
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user role
app.patch("/api/users/secrets/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate role
  if (!["admin", "coordinator", "driver"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const { rowCount } = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role",
      [role, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Role updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete user
app.delete("/api/users/secrets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
// --------------------------------------------------------------------------------------------------

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, email, password, role, full_name FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        user: null,
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        user: null,
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      user: null,
    });
  }
});
// --------------------------------------------------------------------------------------------------
// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  const { email, password, role, fullName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, role, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, full_name`,
      [email, hashedPassword, role, fullName]
    );

    res.status(201).json({
      user: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});

// --------------------------------------------------------------------------------------------------
// Drivers endpoint
// get data from drivers
app.get("/api/drivers", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id,
        name,
        license_number AS "licenseNumber",
        vehicle_assigned AS "vehicleAssigned",
        status
      FROM drivers 
      ORDER BY id
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// Add to drivers
app.post("/api/drivers", async (req, res) => {
  try {
    const { name, licenseNumber, vehicleAssigned, status } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO drivers (name, license_number, vehicle_assigned, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, license_number AS "licenseNumber", vehicle_assigned AS "vehicleAssigned", status`,
      [name, licenseNumber, vehicleAssigned, status]
    );
    res.status(201).json(rows[0]); // Ensure all fields are returned
  } catch (err) {
    console.error("Error adding driver:", err);
    res.status(500).json({ error: "Failed to add driver" });
  }
});
// Update drivers
app.put("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, licenseNumber, vehicleAssigned, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE drivers 
       SET name=$1, license_number=$2, vehicle_assigned=$3, status=$4 
       WHERE id=$5 
       RETURNING id, name, license_number AS "licenseNumber", vehicle_assigned AS "vehicleAssigned", status`,
      [name, licenseNumber, vehicleAssigned, status, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating driver:", err);
    res.status(500).json({ error: "Failed to update driver" });
  }
});

//delete from drivers
app.delete("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM drivers WHERE id=$1", [
      id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.status(204).send(); // Success, no content
  } catch (err) {
    console.error("Error deleting driver:", err);
    res.status(500).json({ error: "Failed to delete driver" });
  }
});

// Vehicle specific for driver
// In your vehicles API endpoint
app.get("/api/vehicles-drivers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, type, plate_number FROM vehicles WHERE status = $1",
      ["Active"] // Only get active vehicles
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------------------------------------------------------------------------------------
// Vehicles endpoint
// GET all vehicles (including status)
app.get("/api/vehicles", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, type, plate_number AS "plateNumber", status
      FROM vehicles
      ORDER BY id
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// POST (add) a new vehicle (including status)
app.post("/api/vehicles", async (req, res) => {
  try {
    const { id, type, plateNumber, status = "Active" } = req.body;

    // Validate required fields
    if (!id || !type || !plateNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { rows } = await pool.query(
      `INSERT INTO vehicles (id, type, plate_number, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, type, plate_number AS "plateNumber", status`,
      [id, type, plateNumber, status]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation
      return res.status(409).json({ error: "Vehicle ID already exists" });
    }
    console.error("Error adding vehicle:", err);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});

// Your PUT route here
app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, plateNumber, status } = req.body;

    if (!type || !plateNumber || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { rows } = await pool.query(
      `UPDATE vehicles
       SET type=$1, plate_number=$2, status=$3
       WHERE id=$4
       RETURNING id, type, plate_number AS "plateNumber", status`,
      [type, plateNumber, status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating vehicle:", err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// DELETE a vehicle
app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM vehicles WHERE id=$1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});
// --------------------------------------------------------------------------------
// Routes endpoint
// GET all routes
app.get("/api/routes", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, address, drop_point AS "dropPoint"
      FROM routes
      ORDER BY id
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching routes:", err);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// POST a new route
app.post("/api/routes", async (req, res) => {
  try {
    const { id, address, dropPoint } = req.body;

    if (!id || !address || !dropPoint) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { rows } = await pool.query(
      `INSERT INTO routes (id, address, drop_point)
       VALUES ($1, $2, $3)
       RETURNING id, address, drop_point AS "dropPoint"`,
      [id, address, dropPoint]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Route code already exists" });
    }
    console.error("Error adding route:", err);
    res.status(500).json({ error: "Failed to add route" });
  }
});

// PUT (update) a route
app.put("/api/routes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { address, dropPoint } = req.body;

    if (!address || !dropPoint) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { rows } = await pool.query(
      `UPDATE routes
       SET address=$1, drop_point=$2
       WHERE id=$3
       RETURNING id, address, drop_point AS "dropPoint"`,
      [address, dropPoint, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating route:", err);
    res.status(500).json({ error: "Failed to update route" });
  }
});

// DELETE a route
app.delete("/api/routes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM routes WHERE id=$1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting route:", err);
    res.status(500).json({ error: "Failed to delete route" });
  }
});

// --------------------------------------------------------------------------------------------------
// Shipments endpoint
app.get("/api/shipments", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM shipments ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching shipments:", err);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

// Endpoint to upload a shipment and save the file
// Assuming Express + pg + body-parser + multer or raw handling
app.put("/api/shipments/:id", upload.single("file_data"), async (req, res) => {
  const { id } = req.params;
  const { name, description, status, createdBy } = req.body;
  const file = req.file;

  try {
    // Build the update query dynamically based on provided fields
    let query = `
      UPDATE shipments 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
    const values = [createdBy || req.body.updatedBy];
    let paramCounter = 2;

    // Add fields to update if they exist in the request
    if (name) {
      query += `, name = $${paramCounter++}`;
      values.push(name);
    }
    if (description) {
      query += `, description = $${paramCounter++}`;
      values.push(description);
    }
    if (status) {
      query += `, status = $${paramCounter++}`;
      values.push(status);
    }
    if (file) {
      query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
      values.push(file.originalname, file.buffer);
    }

    query += ` WHERE id = $${paramCounter} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to update shipment" });
  }
});

// DELETE shipment by ID
app.delete("/api/shipments/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM shipments WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.status(200).json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/shipments", upload.single("file_data"), async (req, res) => {
  const { name, createdBy, description, status } = req.body;
  const file = req.file;

  if (!name || !createdBy || !file) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO shipments (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

    const values = [
      name,
      description || null,
      status || "incomplete",
      createdBy,
      createdBy, // updated_by same as created_by initially
      file.originalname,
      file.buffer,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

app.put(
  "/api/shipments/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
      UPDATE shipments 
      SET 
        file_name = $1,
        file_data = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, file_name
    `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);
// --------------------------------------------------------------------------------------------------

// Dispatch Ouput endpoints
// GET endpoint for dispatch outputs
app.get("/api/dispatch-outputs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM dispatch_outputs ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching dispatch outputs:", err);
    res.status(500).json({ error: "Failed to fetch dispatch outputs" });
  }
});

// Endpoint to upload a dispatch output and save the file
app.put(
  "/api/dispatch-outputs/:id",
  upload.single("file_data"),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, status, createdBy } = req.body;
    const file = req.file;

    try {
      // Build the update query dynamically based on provided fields
      let query = `
      UPDATE dispatch_outputs 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
      const values = [createdBy || req.body.updatedBy];
      let paramCounter = 2;

      // Add fields to update if they exist in the request
      if (name) {
        query += `, name = $${paramCounter++}`;
        values.push(name);
      }
      if (description) {
        query += `, description = $${paramCounter++}`;
        values.push(description);
      }
      if (status) {
        query += `, status = $${paramCounter++}`;
        values.push(status);
      }
      if (file) {
        query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
        values.push(file.originalname, file.buffer);
      }

      query += ` WHERE id = $${paramCounter} RETURNING *`;
      values.push(id);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Dispatch output not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update dispatch output" });
    }
  }
);

// DELETE dispatch output by ID
app.delete("/api/dispatch-outputs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM dispatch_outputs WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Dispatch output not found" });
    }

    res.status(200).json({ message: "Dispatch output deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(
  "/api/dispatch-outputs",
  upload.single("file_data"),
  async (req, res) => {
    const { name, createdBy, description, status } = req.body;
    const file = req.file;

    if (!name || !createdBy || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const query = `
      INSERT INTO dispatch_outputs (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

      const values = [
        name,
        description || null,
        status || "incomplete",
        createdBy,
        createdBy, // updated_by same as created_by initially
        file.originalname,
        file.buffer,
      ];

      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to create dispatch output" });
    }
  }
);

app.put(
  "/api/dispatch-outputs/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
      UPDATE dispatch_outputs 
      SET 
        file_name = $1,
        file_data = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, file_name
    `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);
// --------------------------------------------------------------------------------------------------

// Delivery Forward status endpoint
// GET endpoint for delivery forwards
app.get("/api/delivery-forwards", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM delivery_forwards ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching delivery forwards:", err);
    res.status(500).json({ error: "Failed to fetch delivery forwards" });
  }
});

// Endpoint to update a delivery forward and save the file
app.put(
  "/api/delivery-forwards/:id",
  upload.single("file_data"),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, status, createdBy } = req.body;
    const file = req.file;

    try {
      let query = `
      UPDATE delivery_forwards 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
      const values = [createdBy || req.body.updatedBy];
      let paramCounter = 2;

      if (name) {
        query += `, name = $${paramCounter++}`;
        values.push(name);
      }
      if (description) {
        query += `, description = $${paramCounter++}`;
        values.push(description);
      }
      if (status) {
        query += `, status = $${paramCounter++}`;
        values.push(status);
      }
      if (file) {
        query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
        values.push(file.originalname, file.buffer);
      }

      query += ` WHERE id = $${paramCounter} RETURNING *`;
      values.push(id);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Delivery forward not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update delivery forward" });
    }
  }
);

// DELETE delivery forward by ID
app.delete("/api/delivery-forwards/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM delivery_forwards WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Delivery forward not found" });
    }

    res.status(200).json({ message: "Delivery forward deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new delivery forward
app.post(
  "/api/delivery-forwards",
  upload.single("file_data"),
  async (req, res) => {
    const { name, createdBy, description, status } = req.body;
    const file = req.file;

    if (!name || !createdBy || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const query = `
      INSERT INTO delivery_forwards (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

      const values = [
        name,
        description || null,
        status || "incomplete",
        createdBy,
        createdBy,
        file.originalname,
        file.buffer,
      ];

      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to create delivery forward" });
    }
  }
);

// Update Excel file for delivery forward
app.put(
  "/api/delivery-forwards/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
      UPDATE delivery_forwards 
      SET 
        file_name = $1,
        file_data = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, file_name
    `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);
// --------------------------------------------------------------------------------------------------

// Customer API Endpoints
// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM customers ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching shipments:", err);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

// Update customer
app.put("/api/customers/:id", upload.single("file_data"), async (req, res) => {
  const { id } = req.params;
  const { name, description, status, createdBy } = req.body;
  const file = req.file;

  try {
    // Build the update query dynamically based on provided fields
    let query = `
      UPDATE customers 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
    const values = [createdBy || req.body.updatedBy];
    let paramCounter = 2;

    // Add fields to update if they exist in the request
    if (name) {
      query += `, name = $${paramCounter++}`;
      values.push(name);
    }
    if (description) {
      query += `, description = $${paramCounter++}`;
      values.push(description);
    }
    if (status) {
      query += `, status = $${paramCounter++}`;
      values.push(status);
    }
    if (file) {
      query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
      values.push(file.originalname, file.buffer);
    }

    query += ` WHERE id = $${paramCounter} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "customers not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to update customers" });
  }
});

// Delete customer
app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM customers WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/customers", upload.single("file_data"), async (req, res) => {
  const { name, createdBy, description, status } = req.body;
  const file = req.file;

  if (!name || !createdBy || !file) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO customers (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

    const values = [
      name,
      description || null,
      status || "incomplete",
      createdBy,
      createdBy, // updated_by same as created_by initially
      file.originalname,
      file.buffer,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Update customer Excel file
app.put(
  "/api/customers/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
      UPDATE customers 
      SET 
        file_name = $1,
        file_data = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, file_name
    `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);

// --------------------------------------------------------------------------------------------------
// Summary endpoint
// Get all summary
app.get("/api/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM summary ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Update summary
app.put("/api/summary/:id", upload.single("file_data"), async (req, res) => {
  const { id } = req.params;
  const { name, description, status, createdBy } = req.body;
  const file = req.file;

  try {
    let query = `
      UPDATE summary 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
    const values = [createdBy || req.body.updatedBy];
    let paramCounter = 2;

    if (name) {
      query += `, name = $${paramCounter++}`;
      values.push(name);
    }
    if (description) {
      query += `, description = $${paramCounter++}`;
      values.push(description);
    }
    if (status) {
      query += `, status = $${paramCounter++}`;
      values.push(status);
    }
    if (file) {
      query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
      values.push(file.originalname, file.buffer);
    }

    query += ` WHERE id = $${paramCounter} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Summary not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to update summary" });
  }
});

// Delete summary
app.delete("/api/summary/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM summary WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Summary not found" });
    }

    res.status(200).json({ message: "Summary deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new summary
app.post("/api/summary", upload.single("file_data"), async (req, res) => {
  const { name, createdBy, description, status } = req.body;
  const file = req.file;

  if (!name || !createdBy || !file) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO summary (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

    const values = [
      name,
      description || null,
      status || "incomplete",
      createdBy,
      createdBy,
      file.originalname,
      file.buffer,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to create summary" });
  }
});

// Update summary Excel file
app.put(
  "/api/summary/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
        UPDATE summary 
        SET 
          file_name = $1,
          file_data = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, file_name
      `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);

// --------------------------------------------------------------------------------------------------
// Item snapshots endpoint
// GET endpoint for item snapshots
app.get("/api/item-snapshots", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM item_snapshots ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching item snapshots:", err);
    res.status(500).json({ error: "Failed to fetch item snapshots" });
  }
});

// Endpoint to update an item snapshot and save the file
app.put(
  "/api/item-snapshots/:id",
  upload.single("file_data"),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, status, createdBy } = req.body;
    const file = req.file;

    try {
      let query = `
      UPDATE item_snapshots 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
      const values = [createdBy || req.body.updatedBy];
      let paramCounter = 2;

      if (name) {
        query += `, name = $${paramCounter++}`;
        values.push(name);
      }
      if (description) {
        query += `, description = $${paramCounter++}`;
        values.push(description);
      }
      if (status) {
        query += `, status = $${paramCounter++}`;
        values.push(status);
      }
      if (file) {
        query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
        values.push(file.originalname, file.buffer);
      }

      query += ` WHERE id = $${paramCounter} RETURNING *`;
      values.push(id);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item snapshot not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update item snapshot" });
    }
  }
);

// DELETE item snapshot by ID
app.delete("/api/item-snapshots/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM item_snapshots WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item snapshot not found" });
    }

    res.status(200).json({ message: "Item snapshot deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new item snapshot
app.post(
  "/api/item-snapshots",
  upload.single("file_data"),
  async (req, res) => {
    const { name, createdBy, description, status } = req.body;
    const file = req.file;

    if (!name || !createdBy || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const query = `
      INSERT INTO item_snapshots (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

      const values = [
        name,
        description || null,
        status || "incomplete",
        createdBy,
        createdBy,
        file.originalname,
        file.buffer,
      ];

      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to create item snapshot" });
    }
  }
);

// Update Excel file for item snapshot
app.put(
  "/api/item-snapshots/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
      UPDATE item_snapshots 
      SET 
        file_name = $1,
        file_data = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, file_name
    `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);
// Item Activity Logs endpoint
// GET endpoint for item activity logs
app.get("/api/item-activity-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        created_by AS "createdBy",
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS "updatedAt",
        updated_by AS "updatedBy",
        status,
        file_name,
        file_data
      FROM item_activity_logs ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching item activity logs:", err);
    res.status(500).json({ error: "Failed to fetch item activity logs" });
  }
});

// Endpoint to upload an item activity log and save the file
app.put(
  "/api/item-activity-logs/:id",
  upload.single("file_data"),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, status, createdBy } = req.body;
    const file = req.file;

    try {
      // Build the update query dynamically based on provided fields
      let query = `
      UPDATE item_activity_logs 
      SET 
        updated_at = NOW(),
        updated_by = $1
    `;
      const values = [createdBy || req.body.updatedBy];
      let paramCounter = 2;

      // Add fields to update if they exist in the request
      if (name) {
        query += `, name = $${paramCounter++}`;
        values.push(name);
      }
      if (description) {
        query += `, description = $${paramCounter++}`;
        values.push(description);
      }
      if (status) {
        query += `, status = $${paramCounter++}`;
        values.push(status);
      }
      if (file) {
        query += `, file_name = $${paramCounter++}, file_data = $${paramCounter++}`;
        values.push(file.originalname, file.buffer);
      }

      query += ` WHERE id = $${paramCounter} RETURNING *`;
      values.push(id);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item activity log not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update item activity log" });
    }
  }
);

// DELETE item activity log by ID
app.delete("/api/item-activity-logs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM item_activity_logs WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item activity log not found" });
    }

    res.status(200).json({ message: "Item activity log deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(
  "/api/item-activity-logs",
  upload.single("file_data"),
  async (req, res) => {
    const { name, createdBy, description, status } = req.body;
    const file = req.file;

    if (!name || !createdBy || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const query = `
      INSERT INTO item_activity_logs (
        name, description, status, 
        created_by, updated_by,
        file_name, file_data
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, status,
        created_at, updated_at,
        created_by, updated_by,
        file_name
    `;

      const values = [
        name,
        description || null,
        status || "incomplete",
        createdBy,
        createdBy, // updated_by same as created_by initially
        file.originalname,
        file.buffer,
      ];

      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to create item activity log" });
    }
  }
);

app.put(
  "/api/item-activity-logs/:id/excel",
  upload.single("file_data"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { file_name } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const query = `
      UPDATE item_activity_logs 
      SET 
        file_name = $1,
        file_data = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, file_name
    `;

      const result = await pool.query(query, [
        file_name || file.originalname,
        file.buffer,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Failed to update Excel file" });
    }
  }
);
// ------------------------------------------------------------
// Start server
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
