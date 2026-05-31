import express from "express";
import {
  createCareer,
  getCareers,
  getAllCareersAdmin,
  getCareerById,
  updateCareer,
  deleteCareer,
} from "../controllers/careerController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Public routes
router.get("/", getCareers); // Get all active job listings
router.get("/:id", getCareerById); // Get single job listing

// ✅ Admin routes
router.get("/admin/all", protect, checkAdmin, getAllCareersAdmin); // Get all listings (incl. inactive)
router.post("/", protect, checkAdmin, createCareer); // Create job listing
router.put("/:id", protect, checkAdmin, updateCareer); // Update job listing
router.delete("/:id", protect, checkAdmin, deleteCareer); // Delete job listing

export default router;
