/**
 * vehicleRoutes.js
 * CRUD routes for vehicles. All routes require authentication.
 * Create/Update/Delete restricted to admin role.
 */

import { Router } from "express";
import {
  getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle
} from "../controllers/vehicleController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getVehicles);
router.get("/:id", requireAuth, getVehicleById);
router.post("/", requireAdmin, createVehicle);
router.put("/:id", requireAdmin, updateVehicle);
router.delete("/:id", requireAdmin, deleteVehicle);

export default router;
