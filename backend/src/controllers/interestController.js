/**
 * interestController.js
 * Manages customer interests in vehicles (customer_interest table).
 * Also provides the main report: customers + vehicles they're interested in + applicable promotions.
 */

import pool from "../config/db.js";

// Add a customer interest in a vehicle
export const addInterest = async (req, res) => {
  const { customer_id, vehicle_id } = req.body;
  try {
    await pool.query(
      `INSERT IGNORE INTO customer_interest (customer_id, vehicle_id) VALUES (?, ?)`,
      [customer_id, vehicle_id]
    );
    res.status(201).json({ message: "Interest recorded." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Get all interests (for listing/managing)
export const getInterests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id, c.firstname, c.lastname, c.email, v.brand, v.model, v.plate_number
       FROM customer_interest ci
       JOIN customers c ON ci.customer_id = c.id
       JOIN vehicles v ON ci.vehicle_id = v.id
       ORDER BY ci.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Delete a customer interest
export const deleteInterest = async (req, res) => {
  try {
    await pool.query("DELETE FROM customer_interest WHERE id = ?", [req.params.id]);
    res.json({ message: "Interest removed." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/**
 * generateReport
 * Returns a report of all customers, the vehicles they are interested in,
 * and all promotions that apply to those vehicles (including discount value and performance).
 * Supports optional filters: customer status, promotion title, date range.
 */
export const generateReport = async (req, res) => {
  const { status, title, start_date, end_date } = req.query;

  let query = `
    SELECT 
      c.firstname,
      c.lastname,
      c.email,
      c.status AS customer_status,
      v.brand,
      v.model,
      v.plate_number,
      p.title AS promotion_title,
      p.discount_type,
      p.discount_value,
      p.start_date AS promo_start,
      p.end_date AS promo_end,
      pv.performance
    FROM customer_interest ci
    JOIN customers c ON ci.customer_id = c.id
    JOIN vehicles v ON ci.vehicle_id = v.id
    JOIN promotion_vehicle pv ON pv.vehicle_id = v.id
    JOIN promotions p ON pv.promotion_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += " AND c.status = ?"; params.push(status); }
  if (title) { query += " AND p.title = ?"; params.push(title); }
  if (start_date) { query += " AND p.start_date >= ?"; params.push(start_date); }
  if (end_date) { query += " AND p.end_date <= ?"; params.push(end_date); }
  query += " ORDER BY c.lastname, c.firstname";

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};
