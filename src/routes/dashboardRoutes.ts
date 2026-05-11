import express from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// Get dashboard statistics (Protected)
router.get("/stats", protect, getDashboardStats);

export default router;
