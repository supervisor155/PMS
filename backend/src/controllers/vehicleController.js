/**
 * vehicleController.js
 * CRUD operations for vehicles.
 * Each vehicle is registered by the currently logged-in user (req.session.user.id).
 */

import pool from "../config/db.js";

export const getVehicles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, u.username AS registered_by_username 
       FROM vehicles v 
       JOIN users u ON v.registered_by = u.id 
       ORDER BY v.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Vehicle not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const createVehicle = async (req, res) => {
  const { plate_number, brand, model, year, vehicle_type, purchase_price, status } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO vehicles (plate_number, brand, model, year, vehicle_type, purchase_price, status, registered_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [plate_number, brand, model, year, vehicle_type, purchase_price, status || "available", req.session.user.id]
    );
    res.status(201).json({ message: "Vehicle created.", id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Plate number already exists." });
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const updateVehicle = async (req, res) => {
  const { plate_number, brand, model, year, vehicle_type, purchase_price, status } = req.body;
  try {
    await pool.query(
      `UPDATE vehicles SET plate_number=?, brand=?, model=?, year=?, vehicle_type=?, purchase_price=?, status=? WHERE id=?`,
      [plate_number, brand, model, year, vehicle_type, purchase_price, status, req.params.id]
    );
    res.json({ message: "Vehicle updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    await pool.query("DELETE FROM vehicles WHERE id = ?", [req.params.id]);
    res.json({ message: "Vehicle deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};
