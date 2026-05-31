import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cron from "node-cron";
import compression from "compression";

import connectDB from "./config/db.js";

// importing routes
import chatRoutes from "./routes/chatRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import websiteImageRoutes from "./routes/websiteImageRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import newsLetterRoutes from "./routes/newsLetterRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import cronRoutes from "./routes/cronRoutes.js";
import projectSeederRoutes from "./routes/projectSeeder.js";
import blogSeederRoutes from "./routes/blogSeeder.js";
import quoteRequestRoutes from "./routes/quoteRequestRoutes.js";
import careerRoutes from "./routes/careerRoutes.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Compression middleware - reduces response sizes by 70-90%
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: [
      "https://dashboard.maldonite.com",
      "https://maldonite.com",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

// Parse JSON and URL-encoded bodies with safer limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.send(`Server is running on PORT: ${PORT}`);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/website-images", websiteImageRoutes);
app.use("/api/v1/site-settings", siteSettingsRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/testimonials", testimonialRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/news-letter", newsLetterRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/quote-requests", quoteRequestRoutes);
app.use("/api/v1/maldo", chatRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/careers", careerRoutes);
app.use("/api", cronRoutes);
app.use("/api/v1/projects", projectSeederRoutes);
app.use("/api/v1/blogs", blogSeederRoutes);

// Ping endpoint for health check
app.get("/api/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pong! Server is awake.",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server Running at http://localhost:${PORT}`);

  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

  // Simple keep-alive ping every 5 minutes - no DB logging to reduce I/O
  cron.schedule("*/5 * * * *", async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      await fetch(`${SERVER_URL}/api/ping`, {
        signal: controller.signal,
        headers: { "User-Agent": "Maldonite-KeepAlive/1.0" },
      });
      clearTimeout(timeoutId);
    } catch (error) {
      // Silent fail - no DB write overhead
      if (process.env.NODE_ENV === "production") {
        console.error(`Ping failed: ${error.message}`);
      }
    }
  });

  // Backup ping as a simple interval-based fallback
  if (process.env.NODE_ENV === "production") {
    setInterval(async () => {
      try {
        await fetch(`${SERVER_URL}/api/ping`, {
          headers: { "User-Agent": "Maldonite-Backup/1.0" },
        });
      } catch {
        // Silent
      }
    }, 300000); // Every 5 minutes
  }
});
