import express from "express";
import upload from "../middlewares/multer.js";
import {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

const testimonialImageUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "icon", maxCount: 1 },
]);
// ✅ Routes
router.post(
  "/",
  protect,
  checkAdmin,
  testimonialImageUpload,
  createTestimonial
); // Add testimonial with image
router.get("/", getTestimonials); // Get all testimonials
router.get("/:id", getTestimonialById); // Get one testimonial
router.put(
  "/:id",
  protect,
  checkAdmin,
  testimonialImageUpload,
  updateTestimonial
); // Update testimonial with optional new image
router.delete("/:id", protect, checkAdmin, deleteTestimonial); // Delete testimonial

export default router;
