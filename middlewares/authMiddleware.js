import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes and set req.user
export const protect = async (req, res, next) => {
  let token;

  console.log("=== AUTH MIDDLEWARE DEBUG ===");
  console.log("Authorization header:", req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token found, verifying...");

      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      // The payload structure is { user: { id: user._id, role: user.role } }
      const userId = decoded.user?.id;
      console.log("Extracted user ID:", userId);

      if (!userId) {
        console.log("No user ID found in token");
        return res.status(401).json({
          message: "Invalid token payload",
          error: "No user ID in token",
        });
      }

      // Find user by ID, exclude password
      const user = await User.findById(userId).select("-password");
      console.log("Found user:", user ? user.email : "Not found");

      if (!user) {
        return res.status(401).json({
          message: "User not found",
          userId: userId,
        });
      }

      req.user = user; // attach user to request
      console.log("User authenticated successfully:", user.email);
      next();
    } catch (error) {
      console.error("JWT Error:", error);
      console.error("JWT Error name:", error.name);
      console.error("JWT Error message:", error.message);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token expired",
          error: error.message,
        });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Invalid token",
          error: error.message,
        });
      }

      return res.status(401).json({
        message: "Authentication failed",
        error: error.message,
      });
    }
  } else {
    console.log("No authorization header found");
    return res.status(401).json({
      message: "No token provided",
      headers: req.headers,
    });
  }
};

// Middleware to check if user is admin
export const checkAdmin = (req, res, next) => {
  console.log("=== ADMIN CHECK DEBUG ===");
  console.log("User object:", req.user);
  console.log("User role:", req.user?.role);
  console.log("Is admin?", req.user?.role === "admin");

  if (req.user && req.user.role === "admin") {
    console.log("Admin access granted");
    next();
  } else {
    console.log("Admin access denied");
    return res.status(403).json({
      message: "Access denied. Admins only.",
      userRole: req.user?.role,
      userId: req.user?._id,
    });
  }
};
