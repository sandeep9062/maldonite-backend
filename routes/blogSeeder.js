import express from "express";
import Blog from "../models/Blog.js";
import { blogs } from "../data/Blogs.js";

const router = express.Router();

// POST /api/blogs/seed - Seed blogs data
router.post("/seed", async (req, res) => {
  try {
    // Check if blogs already exist to avoid duplicates
    const existingBlogs = await Blog.countDocuments();

    if (existingBlogs > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Blogs data already exists. Use /api/blogs/seed/reset to clear first.",
      });
    }

    // Insert seed data
    const seededBlogs = await Blog.insertMany(blogs);

    res.status(201).json({
      success: true,
      message: `${seededBlogs.length} blogs seeded successfully`,
      count: seededBlogs.length,
    });
  } catch (error) {
    console.error("Error seeding blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed blogs",
      error: error.message,
    });
  }
});

// POST /api/blogs/seed/reset - Clear and reseed blogs data
router.post("/seed/reset", async (req, res) => {
  try {
    // Clear existing blogs
    await Blog.deleteMany({});

    // Insert seed data
    const seededBlogs = await Blog.insertMany(blogs);

    res.status(200).json({
      success: true,
      message: `Database cleared and ${seededBlogs.length} blogs reseeded successfully`,
      count: seededBlogs.length,
    });
  } catch (error) {
    console.error("Error resetting and seeding blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset and seed blogs",
      error: error.message,
    });
  }
});

// GET /api/blogs/seed/status - Check if blogs exist
router.get("/seed/status", async (req, res) => {
  try {
    const count = await Blog.countDocuments();
    res.status(200).json({
      success: true,
      message: "Blogs seeding status",
      count,
      hasData: count > 0,
    });
  } catch (error) {
    console.error("Error checking blogs status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check blogs status",
      error: error.message,
    });
  }
});

export default router;
