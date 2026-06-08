/**
 * customerController.js
 * CRUD operations for customers.
 * Each customer is registered by the currently logged-in user (req.session.user.id).
 */

import pool from "../config/db.js";

export const getCustomers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.username AS registered_by_username 
       FROM customers c 
       JOIN users u ON c.registered_by = u.id 
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Customer not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const createCustomer = async (req, res) => {
  const { firstname, lastname, email, phonenumber, status } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO customers (firstname, lastname, email, phonenumber, status, registered_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [firstname, lastname, email, phonenumber, status || "active", req.session.user.id]
    );
    res.status(201).json({ message: "Customer created.", id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already exists." });
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  const { firstname, lastname, email, phonenumber, status } = req.body;
  try {
    await pool.query(
      `UPDATE customers SET firstname=?, lastname=?, email=?, phonenumber=?, status=? WHERE id=?`,
      [firstname, lastname, email, phonenumber, status, req.params.id]
    );
    res.json({ message: "Customer updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
    res.json({ message: "Customer deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};
