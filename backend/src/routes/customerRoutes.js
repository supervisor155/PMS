/**
 * customerRoutes.js
 * CRUD routes for customers. All routes require authentication.
 * Staff can create customers; admin can delete.
 */

import { Router } from "express";
import {
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer
} from "../controllers/customerController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getCustomers);
router.get("/:id", requireAuth, getCustomerById);
router.post("/", requireAuth, createCustomer);
router.put("/:id", requireAuth, updateCustomer);
router.delete("/:id", requireAdmin, deleteCustomer);

export default router;
