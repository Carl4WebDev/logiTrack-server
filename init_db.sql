-- Create tables for logistics system
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coordinator', 'driver')),
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    vehicle_assigned VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    drop_point VARCHAR(255) NOT NULL
);

-- File-based tables
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

CREATE TABLE IF NOT EXISTS dispatch_outputs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

CREATE TABLE IF NOT EXISTS delivery_forwards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

CREATE TABLE IF NOT EXISTS summary (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

CREATE TABLE IF NOT EXISTS item_snapshots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

CREATE TABLE IF NOT EXISTS item_activity_logs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    file_name VARCHAR(255),
    file_data BYTEA
);

-- Insert initial admin user (password will be hashed by your application)
INSERT INTO users (email, password, role, full_name) 
VALUES ('admin@example.com', '$2b$10$examplehashedpassword', 'admin', 'Admin User')
ON CONFLICT (email) DO NOTHING;