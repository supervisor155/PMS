/**
 * promotionRoutes.js
 * CRUD routes for promotions and vehicle linking.
 * Create/Update/Delete restricted to admin role.
 */

import { Router } from "express";
import {
  getPromotions, getPromotionById, createPromotion, updatePromotion,
  deletePromotion, linkVehicle, getLinkedVehicles
} from "../controllers/promotionController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getPromotions);
router.get("/:id", requireAuth, getPromotionById);
router.post("/", requireAdmin, createPromotion);
router.put("/:id", requireAdmin, updatePromotion);
router.delete("/:id", requireAdmin, deletePromotion);
router.post("/:id/vehicles", requireAdmin, linkVehicle);
router.get("/:id/vehicles", requireAuth, getLinkedVehicles);

export default router;
