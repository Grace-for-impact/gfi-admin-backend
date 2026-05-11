import express from "express";
import { 
  createJob, 
  getJobs, 
  getJobById, 
  updateJob, 
  deleteJob 
} from "../controllers/jobController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.route("/")
  .get(getJobs)
  .post(protect, createJob);

router.route("/:id")
  .get(getJobById)
  .put(protect, updateJob)
  .delete(protect, deleteJob);

export default router;
