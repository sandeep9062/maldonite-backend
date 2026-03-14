import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug, // ✅ Import the new controller
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Routes
router.post("/", protect, checkAdmin, upload.single("image"), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/slug/:slug", getProductBySlug); // ✅ Add the new route
router.put("/:id", protect, checkAdmin, upload.single("image"), updateProduct);
router.delete("/:id", protect, checkAdmin, deleteProduct);

export default router;