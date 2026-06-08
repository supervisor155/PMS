-- schema.sql
-- Full database schema for the Promotion and Marketing Subsystem (PMS).
-- Run this file once to create the database, all tables, and seed starter data.
-- Default admin login: username=admin | password=admin123
-- Default staff login: username=staff1 | password=staff123

CREATE DATABASE IF NOT EXISTS pms;
USE pms;

-- Users table: stores login credentials and roles
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table: registered by a user
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year YEAR NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  purchase_price DECIMAL(12, 2) NOT NULL,
  status ENUM('available', 'unavailable', 'sold') NOT NULL DEFAULT 'available',
  registered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Customers table: registered by a user (staff or admin)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phonenumber VARCHAR(20) NOT NULL,
  status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
  registered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Promotions table: created by admin
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title ENUM(
    'new year sale',
    'holiday price slash',
    'weekend flash sale',
    'clearance discount offer',
    'seasonal price drop'
  ) NOT NULL,
  description TEXT,
  discount_type ENUM('free', 'percentage', 'FLAT_RATE', 'CASHBACK', 'BUY_ONE_GET_ONE', 'Bundle', 'amount') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active', 'inactive', 'expired') NOT NULL DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Promotion_Vehicle: links promotions to vehicles
-- performance = number of inquiries that promotion generated for that vehicle
CREATE TABLE IF NOT EXISTS promotion_vehicle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promotion_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  performance INT NOT NULL DEFAULT 0,
  UNIQUE KEY unique_promo_vehicle (promotion_id, vehicle_id),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Customer_Interest: links customers to vehicles they are interested in
CREATE TABLE IF NOT EXISTS customer_interest (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_customer_vehicle (customer_id, vehicle_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users
-- Passwords are bcrypt hashes:
--   admin123  → $2b$10$c.no1t4kqv6y.Z.SUHh/w.Rhj3x1b.uH.SG6OePWF9nShiz.8g6qu
--   staff123  → $2b$10$nc7KLaGV9Sz7PllqwD0DRuJqV252cC7UrHAvHbBBvI4lpIUXsQDMq
INSERT INTO users (username, password, role) VALUES
  ('admin',  '$2b$10$c.no1t4kqv6y.Z.SUHh/w.Rhj3x1b.uH.SG6OePWF9nShiz.8g6qu', 'admin'),
  ('staff1', '$2b$10$nc7KLaGV9Sz7PllqwD0DRuJqV252cC7UrHAvHbBBvI4lpIUXsQDMq', 'staff')
ON DUPLICATE KEY UPDATE username = username;

-- Vehicles (registered by admin = id 1)
INSERT INTO vehicles (plate_number, brand, model, year, vehicle_type, purchase_price, status, registered_by) VALUES
  ('RAA 001 A', 'Toyota',   'Corolla',  2020, 'Sedan',  18000.00, 'available',   1),
  ('RAB 002 B', 'Honda',    'CR-V',     2021, 'SUV',    25000.00, 'available',   1),
  ('RAC 003 C', 'Nissan',   'X-Trail',  2019, 'SUV',    22000.00, 'available',   1),
  ('RAD 004 D', 'Toyota',   'Land Cruiser', 2022, 'SUV', 55000.00, 'available',  1),
  ('RAE 005 E', 'Mercedes', 'C-Class',  2021, 'Sedan',  42000.00, 'unavailable', 1),
  ('RAF 006 F', 'Hyundai',  'Tucson',   2020, 'SUV',    21000.00, 'sold',        1)
ON DUPLICATE KEY UPDATE plate_number = plate_number;

-- Customers (registered by staff1 = id 2)
INSERT INTO customers (firstname, lastname, email, phonenumber, status, registered_by) VALUES
  ('Alice',   'Uwase',    'alice.uwase@email.com',    '+250780000001', 'active',   2),
  ('Bob',     'Mugisha',  'bob.mugisha@email.com',    '+250780000002', 'active',   2),
  ('Claire',  'Ineza',    'claire.ineza@email.com',   '+250780000003', 'inactive', 2),
  ('David',   'Habimana', 'david.habimana@email.com', '+250780000004', 'active',   2),
  ('Eva',     'Muneza',   'eva.muneza@email.com',     '+250780000005', 'blocked',  2)
ON DUPLICATE KEY UPDATE email = email;

-- Promotions (created by admin = id 1)
INSERT INTO promotions (title, description, discount_type, discount_value, start_date, end_date, status, created_by) VALUES
  ('new year sale',          'Kick off the new year with great savings!',    'percentage',    15.00, '2026-01-01', '2026-01-31', 'active',   1),
  ('weekend flash sale',     'Limited time weekend deals on select SUVs.',   'FLAT_RATE',   2000.00, '2026-02-01', '2026-12-31', 'active',   1),
  ('clearance discount offer','Clear old stock at unbeatable prices.',        'amount',      5000.00, '2026-01-15', '2026-12-31', 'active',   1),
  ('holiday price slash',    'Holiday season discounts for all customers.',  'CASHBACK',    1500.00, '2025-12-20', '2026-01-05', 'expired',  1),
  ('seasonal price drop',    'Seasonal offer — buy now before stock runs out.','Bundle',       0.00, '2026-03-01', '2026-06-30', 'inactive', 1)
ON DUPLICATE KEY UPDATE title = title;

-- Promotion_Vehicle links (only available vehicles, within active promo dates)
INSERT INTO promotion_vehicle (promotion_id, vehicle_id, performance) VALUES
  (1, 1, 12),  -- new year sale       → Toyota Corolla
  (1, 2, 8),   -- new year sale       → Honda CR-V
  (2, 2, 20),  -- weekend flash sale  → Honda CR-V
  (2, 3, 15),  -- weekend flash sale  → Nissan X-Trail
  (3, 4, 5),   -- clearance offer     → Toyota Land Cruiser
  (3, 1, 9)    -- clearance offer     → Toyota Corolla
ON DUPLICATE KEY UPDATE performance = performance;

-- Customer Interests
INSERT INTO customer_interest (customer_id, vehicle_id) VALUES
  (1, 1),  -- Alice     → Toyota Corolla
  (1, 2),  -- Alice     → Honda CR-V
  (2, 2),  -- Bob       → Honda CR-V
  (2, 4),  -- Bob       → Toyota Land Cruiser
  (3, 3),  -- Claire    → Nissan X-Trail
  (4, 1),  -- David     → Toyota Corolla
  (4, 4),  -- David     → Toyota Land Cruiser
  (5, 2)   -- Eva       → Honda CR-V
ON DUPLICATE KEY UPDATE customer_id = customer_id;
