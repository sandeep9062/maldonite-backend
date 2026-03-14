import express from "express";
import {
  generatePropertyDescriptionController,
  generateSeoMetaController,
  generateMatchScoreController,
  generateLocalityGuideController,
  generatePropertyDetailsController,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/description", generatePropertyDescriptionController);
router.post("/seo-meta", generateSeoMetaController);
router.post("/match-score", generateMatchScoreController);
router.post("/locality-guide", generateLocalityGuideController);
router.post("/magic-fill", generatePropertyDetailsController); // Reusing the same controller for Magic Fill, can be changed if needed
export default router;
