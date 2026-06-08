/**
 * interestRoutes.js
 * Routes to manage customer interests in vehicles and generate the PMS report.
 */

import { Router } from "express";
import { addInterest, getInterests, deleteInterest, generateReport } from "../controllers/interestController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getInterests);
router.post("/", requireAuth, addInterest);
router.delete("/:id", requireAdmin, deleteInterest);
router.get("/report", requireAuth, generateReport);

export default router;
