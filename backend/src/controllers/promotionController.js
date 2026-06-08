/**
 * promotionController.js
 * CRUD operations for promotions.
 * Also handles linking promotions to vehicles (promotion_vehicle) with performance tracking.
 * Validation: promotion can only be applied to vehicles with status 'available'.
 */

import pool from "../config/db.js";

export const getPromotions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.username AS created_by_username 
       FROM promotions p 
       JOIN users u ON p.created_by = u.id 
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const getPromotionById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM promotions WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Promotion not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const createPromotion = async (req, res) => {
  const { title, description, discount_type, discount_value, start_date, end_date, status } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO promotions (title, description, discount_type, discount_value, start_date, end_date, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, discount_type, discount_value, start_date, end_date, status || "active", req.session.user.id]
    );
    res.status(201).json({ message: "Promotion created.", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const updatePromotion = async (req, res) => {
  const { title, description, discount_type, discount_value, start_date, end_date, status } = req.body;
  try {
    await pool.query(
      `UPDATE promotions SET title=?, description=?, discount_type=?, discount_value=?, start_date=?, end_date=?, status=? WHERE id=?`,
      [title, description, discount_type, discount_value, start_date, end_date, status, req.params.id]
    );
    res.json({ message: "Promotion updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    await pool.query("DELETE FROM promotions WHERE id = ?", [req.params.id]);
    res.json({ message: "Promotion deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Link a promotion to a vehicle with validation
export const linkVehicle = async (req, res) => {
  const { vehicle_id, performance } = req.body;
  const promotion_id = req.params.id;
  try {
    // Validate: vehicle must be available
    const [vehicles] = await pool.query("SELECT status FROM vehicles WHERE id = ?", [vehicle_id]);
    if (vehicles.length === 0) return res.status(404).json({ message: "Vehicle not found." });
    if (vehicles[0].status !== "available") {
      return res.status(400).json({ message: "Promotion can only be applied to available vehicles." });
    }
    // Validate: current date must be within promotion period
    const [promos] = await pool.query("SELECT start_date, end_date FROM promotions WHERE id = ?", [promotion_id]);
    if (promos.length === 0) return res.status(404).json({ message: "Promotion not found." });
    const today = new Date();
    const start = new Date(promos[0].start_date);
    const end = new Date(promos[0].end_date);
    if (today < start || today > end) {
      return res.status(400).json({ message: "Promotion is not currently active (outside date range)." });
    }
    await pool.query(
      `INSERT INTO promotion_vehicle (promotion_id, vehicle_id, performance) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE performance = VALUES(performance)`,
      [promotion_id, vehicle_id, performance || 0]
    );
    res.status(201).json({ message: "Vehicle linked to promotion." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Get all vehicles linked to a promotion
export const getLinkedVehicles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, pv.performance 
       FROM promotion_vehicle pv 
       JOIN vehicles v ON pv.vehicle_id = v.id 
       WHERE pv.promotion_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};
