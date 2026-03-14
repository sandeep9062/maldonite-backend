import express from "express";
import Project from "../models/Projects.js";
import { projects } from "../data/Projects.js";

const router = express.Router();

// POST /api/projects/seed - Seed projects data
router.post("/seed", async (req, res) => {
  try {
    // Check if projects already exist to avoid duplicates
    const existingProjects = await Project.countDocuments();

    if (existingProjects > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Projects data already exists. Use /api/projects/seed/reset to clear first.",
      });
    }

    // Insert seed data
    const seededProjects = await Project.insertMany(projects);

    res.status(201).json({
      success: true,
      message: `${seededProjects.length} projects seeded successfully`,
      count: seededProjects.length,
    });
  } catch (error) {
    console.error("Error seeding projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed projects",
      error: error.message,
    });
  }
});

// POST /api/projects/seed/reset - Clear and reseed projects data
router.post("/seed/reset", async (req, res) => {
  try {
    // Clear existing projects
    await Project.deleteMany({});

    // Insert seed data
    const seededProjects = await Project.insertMany(projects);

    res.status(200).json({
      success: true,
      message: `Database cleared and ${seededProjects.length} projects reseeded successfully`,
      count: seededProjects.length,
    });
  } catch (error) {
    console.error("Error resetting and seeding projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset and seed projects",
      error: error.message,
    });
  }
});

// GET /api/projects/seed/status - Check if projects exist
router.get("/seed/status", async (req, res) => {
  try {
    const count = await Project.countDocuments();
    res.status(200).json({
      success: true,
      message: "Projects seeding status",
      count,
      hasData: count > 0,
    });
  } catch (error) {
    console.error("Error checking projects status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check projects status",
      error: error.message,
    });
  }
});

export default router;
