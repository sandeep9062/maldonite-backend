import express from "express";
import upload from "../middlewares/multer.js";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  addComment,
  deleteBlogImage,
  getBlogBySlug, // ✅ Import the new controller function
} from "../controllers/blogController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

const blogImageUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "authorImage", maxCount: 1 },
]);

// ✅ Blog Routes
router.post("/", protect, checkAdmin, blogImageUpload, createBlog);
router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.get("/slug/:slug", getBlogBySlug); // Correct route to use slug
router.put("/:id", protect, checkAdmin, blogImageUpload, updateBlog);
router.delete("/:id", protect, checkAdmin, deleteBlog);
router.delete("/:id/image", protect, checkAdmin, deleteBlogImage); // ✅ New route to delete blog image

router.post("/:id/comments", addComment);

export default router;