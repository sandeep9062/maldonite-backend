/**
 * Authentication Controller
 *
 * This file re-exports functions from the new auth module for backward compatibility.
 * New implementation is in /auth/auth.controller.js and /auth/auth.service.js
 */

import * as authService from "../auth/auth.service.js";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  extractTokensFromRequest,
} from "../auth/jwt.utils.js";
import User from "../models/User.js";
import crypto from "crypto";
import { sendForgotPasswordEmail } from "../utils/send-email.js";

/**
 * Get client metadata from request
 */
const getClientMetadata = (req) => ({
  userAgent: req.headers["user-agent"] || "Unknown",
  ipAddress:
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip ||
    "Unknown",
});

// ==================
// REGISTER USER
// ==================
export const register = async (req, res) => {
  try {
    const { userAgent, ipAddress } = getClientMetadata(req);

    const result = await authService.registerUser(
      req.body,
      userAgent,
      ipAddress,
    );

    // Set cookies
    res.cookie(
      "accessToken",
      result.accessToken,
      getAccessTokenCookieOptions(),
    );
    res.cookie(
      "refreshToken",
      result.refreshToken,
      getRefreshTokenCookieOptions(),
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: result.user,
    });
  } catch (error) {
    console.error("Register error:", error.message);

    const message =
      error.message === "Email already registered"
        ? error.message
        : error.message.includes("required") ||
            error.message.includes("Invalid") ||
            error.message.includes("Password")
          ? error.message
          : "Registration failed. Please try again.";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==================
// LOGIN USER
// ==================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { userAgent, ipAddress } = getClientMetadata(req);

    const result = await authService.loginUser(
      email,
      password,
      userAgent,
      ipAddress,
    );

    // Set cookies
    res.cookie(
      "accessToken",
      result.accessToken,
      getAccessTokenCookieOptions(),
    );
    res.cookie(
      "refreshToken",
      result.refreshToken,
      getRefreshTokenCookieOptions(),
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    const message = error.message.includes("banned")
      ? error.message
      : "Invalid email or password";

    res.status(401).json({
      success: false,
      message,
    });
  }
};

// ==================
// LOGOUT USER
// ==================
export const logout = async (req, res) => {
  try {
    const { refreshToken } = extractTokensFromRequest(req);

    await authService.logoutUser(refreshToken);

    // Clear cookies
    res.clearCookie("accessToken", getClearCookieOptions());
    res.clearCookie("refreshToken", getClearCookieOptions());

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    // Still clear cookies even on error
    res.clearCookie("accessToken", getClearCookieOptions());
    res.clearCookie("refreshToken", getClearCookieOptions());

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
};

// ==================
// CHANGE PASSWORD
// ==================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    // Get user from database (attached by auth middleware)
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    if (user.password) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================
// UPDATE USER PROFILE
// ==================
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, image } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (image) user.image = image;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================
// GET CURRENT USER PROFILE
// ==================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    res.status(404).json({
      success: false,
      message: error.message || "User not found",
    });
  }
};

// ==================
// FORGOT PASSWORD
// ==================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token and set to user
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await sendForgotPasswordEmail(user.email, resetUrl, user.name);

      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==================
// RESET PASSWORD
// ==================
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Clear all refresh tokens (force re-login on all devices)
    user.refreshTokens = [];
    user.tokenVersion += 1;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
