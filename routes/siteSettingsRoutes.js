import express from "express";
import {
  getSiteSettings,
  createSiteSettings,
  updateSiteSettings,
  deleteSiteSettings,
} from "../controllers/siteSettingsController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

const brandingUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
]);

// Single-document CRUD
router.get("/", getSiteSettings);
router.post("/", protect, checkAdmin,brandingUpload, createSiteSettings);
router.put("/:id", protect, checkAdmin,brandingUpload, updateSiteSettings);
router.delete("/:id", protect, checkAdmin, deleteSiteSettings);

export default router;
