import express from "express";
import {
  getProjects,
  getProjectById,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/", getProjects);
router.get("/slug/:slug", getProjectBySlug);
router.get("/:id", getProjectById);
router.post("/", protect, checkAdmin, upload.array("image"), createProject);
router.put("/:id", protect, checkAdmin, upload.array("image"), updateProject);
router.delete("/:id", protect, checkAdmin, deleteProject);

export default router;
