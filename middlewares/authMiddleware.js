import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes and set req.user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Note: decoded.user.id or decoded.id depends on how you sign the token
      // Make sure this matches your JWT sign method
      const userId = decoded.user?.id || decoded.id;

      if (!userId) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      // Find user by ID, exclude password
      const user = await User.findById(userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // attach user to request
      next();
    } catch (error) {
      console.error("JWT Error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
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
