import express from "express";
import {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
} from "../controllers/applicationController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// Public submission
router.post("/", submitApplication);

// Admin only routes
router.get("/", protect, getApplications);
router.get("/:id", protect, getApplicationById);
router.put("/:id/status", protect, updateApplicationStatus);

export default router;
