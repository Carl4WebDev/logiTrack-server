CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_assigned VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
  id VARCHAR(10) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  plate_number VARCHAR(20) NOT NULL
);

CREATE TABLE excel_files (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  data BYTEA NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at SET DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at SET DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);


CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at SET DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at SET DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);


CREATE TABLE summary (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at SET DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at SET DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);
-- /When craeting a non-existing table
CREATE TABLE dispatch_outputs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);

-- When Altering a existent table
CREATE TABLE dispatch_outputs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at SET DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at SET DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);

CREATE TABLE delivery_forwards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);

CREATE TABLE item_activity_logs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA
);


-- ALTER TABLE customers
-- ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
