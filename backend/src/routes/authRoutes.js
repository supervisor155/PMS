/**
 * authRoutes.js
 * Authentication routes.
 *
 * Public (no auth needed):
 *   POST /login           — session login
 *   POST /register        — public signup, always assigns 'staff' role
 *   POST /reset-password  — use token to change password
 *
 * Authenticated:
 *   POST /logout          — destroy session
 *   GET  /me              — return session user
 *
 * Admin-only:
 *   POST   /users                  — admin creates user with any role
 *   GET    /users                  — list all users
 *   DELETE /users/:id              — delete a user
 *   POST   /users/:id/reset-token  — generate one-time reset token
 */

import { Router } from "express";
import {
  register, login, logout, me,
  createUser, getUsers, deleteUser,
  generateResetToken, resetPassword,
} from "../controllers/authController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Public
router.post("/login", login);
router.post("/register", register);
router.post("/reset-password", resetPassword);

// Authenticated
router.post("/logout", requireAuth, logout);
router.get("/me", me);

// Admin-only
router.post("/users", requireAdmin, createUser);
router.get("/users", requireAdmin, getUsers);
router.delete("/users/:id", requireAdmin, deleteUser);
router.post("/users/:id/reset-token", requireAdmin, generateResetToken);

export default router;
