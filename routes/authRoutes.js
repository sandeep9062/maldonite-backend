import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

/**
 * Authentication Routes (Legacy)
 *
 * Core auth routes (register, login, logout, refresh, google, me, logout-all)
 * are now handled by /auth/auth.routes.js
 *
 * This file handles additional routes:
 * - POST /api/auth/forgot-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 * - PUT /api/auth/profile - Update user profile
 * - POST /api/auth/change-password - Change password (authenticated)
 */

const router = express.Router();

// Password reset routes (public)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.put("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);

export default router;
