import express from "express";
import upload from "../middlewares/multer.js";
import {
  createService,
  getServices,
  getServiceBySlug,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Multer fields for service images
const serviceImageUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "serviceImage", maxCount: 1 },
]);

// =============================
// Service Routes
// =============================

// Create a new service (Admin only)
router.post("/", protect, checkAdmin, serviceImageUpload, createService);

// Get all services
router.get("/", getServices);

// Get service by slug
router.get("/slug/:slug", getServiceBySlug);

// Update service by ID (Admin only)
router.put("/:id", protect, checkAdmin, serviceImageUpload, updateService);

// Delete service by ID (Admin only)
router.delete("/:id", protect, checkAdmin, deleteService);

export default router;
