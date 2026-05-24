import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Cache for token blacklist (in production, use Redis)
const tokenCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// Middleware to protect routes and set req.user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Invalid token payload",
        });
      }

      // Find user by ID, select only needed fields
      const user = await User.findById(userId)
        .select("email name role avatar")
        .lean()
        .maxTimeMS(5000);

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      return res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// Middleware to check if user is admin
export const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
};
