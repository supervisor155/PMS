/**
 * authController.js
 * Handles user authentication: login, logout, session check, user management.
 * Password reset flow (admin-only):
 *   1. Admin calls generateResetToken(userId) → server creates a random token,
 *      stores its bcrypt hash + expiry in DB, returns the plain token once.
 *   2. Admin copies the token and gives it to the user manually.
 *   3. User calls resetPassword(token, newPassword) → server verifies token,
 *      updates password, deletes token.
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../config/db.js";

// Public signup — role is always 'staff', no exceptions.
export const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required." });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'staff')",
      [username, hashed]
    );
    res.status(201).json({ message: "Account created. You can now log in." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Username already taken." });
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Admin creates a user with a chosen role (staff or admin)
export const createUser = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required." });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashed, role || "staff"]
    );
    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Username already taken." });
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Login and create session
export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials." });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ message: "Login successful.", user: req.session.user });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Logout and destroy session
export const logout = (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out successfully." }));
};

// Return current session user info
export const me = (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated." });
  res.json({ user: req.session.user });
};

// Admin: list all users (excluding passwords)
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// Admin: delete a user (cannot delete yourself)
export const deleteUser = async (req, res) => {
  if (parseInt(req.params.id) === req.session.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/**
 * Admin: generate a one-time password reset token for a user.
 * Returns the plain token ONCE — admin must copy and hand it to the user.
 * The token expires in 1 hour. Its hash is stored in the DB.
 */
export const generateResetToken = async (req, res) => {
  const userId = req.params.id;
  try {
    const [users] = await pool.query("SELECT id, username FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    // Generate a secure random 8-digit numeric token (10000000 – 99999999)
    const plainToken = String(crypto.randomInt(10000000, 99999999));
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [hashedToken, expiresAt, userId]
    );

    res.json({
      message: `Reset token generated for ${users[0].username}. Copy it now — it will not be shown again.`,
      token: plainToken,
      expires_at: expiresAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/**
 * Reset password using a valid token.
 * Requires: username, token (plain), newPassword.
 * Token is verified against the stored hash and must not be expired.
 */
export const resetPassword = async (req, res) => {
  const { username, token, newPassword } = req.body;
  if (!username || !token || !newPassword) {
    return res.status(400).json({ message: "Username, token, and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }
  try {
    const [rows] = await pool.query(
      "SELECT id, reset_token, reset_token_expires FROM users WHERE username = ?",
      [username]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });
    const user = rows[0];

    if (!user.reset_token) {
      return res.status(400).json({ message: "No reset token found for this user." });
    }
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ message: "Reset token has expired. Ask admin to generate a new one." });
    }

    const valid = await bcrypt.compare(token, user.reset_token);
    if (!valid) return res.status(400).json({ message: "Invalid token." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashed, user.id]
    );
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};
