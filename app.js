import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cron from "node-cron";

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

import PingLog from "./models/PingLog.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

// This allows your Next.js frontend (on a different port) to communicate with the Express backend.
// In production, you would configure this to only allow specific origins.
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

// ✅ PAYLOAD TOO LARGE FIX: Increase the body parser limits.
// This allows Express to handle larger request bodies, which is necessary for file uploads.
// The default limit is usually too small for files.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send(`Server is running on PORT: ${PORT}`);
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
app.use("/api", cronRoutes);
app.use("/api/v1/projects", projectSeederRoutes);
app.use("/api/v1/blogs", blogSeederRoutes);

// Ping endpoint for health check and keep-alive
app.get("/api/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pong! Server is awake",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
// Start server
app.listen(PORT, () => {
  console.log(`✅ Server Running at http://localhost:${PORT}`);

  // Setup cron job to ping the server every 2 minutes to keep it awake
  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

  cron.schedule("*/2 * * * *", async () => {
    const startTime = Date.now();
    const pingTime = new Date();

    try {
      const response = await fetch(`${SERVER_URL}/api/ping`);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      // Save successful ping log to database
      const pingLog = new PingLog({
        pingTime,
        status: "success",
        responseTime,
        message: data.message,
        serverUrl: SERVER_URL,
        statusCode: response.status,
      });
      await pingLog.save();

      console.log(
        `🔄 [${pingTime.toISOString()}] Ping cron: ${data.message} (${responseTime}ms)`,
      );

      // NEW: Every 30th ping (roughly once an hour), delete logs older than 24 hours
      if (new Date().getMinutes() % 30 === 0) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await PingLog.deleteMany({ pingTime: { $lt: oneDayAgo } });
        console.log("🧹 Cleaned up old ping logs to save space.");
      }
    } catch (error) {
      // Save failed ping log to database
      const responseTime = Date.now() - startTime;
      const pingLog = new PingLog({
        pingTime,
        status: "failed",
        responseTime,
        message: error.message,
        serverUrl: SERVER_URL,
        statusCode: null,
      });
      await pingLog.save();

      console.error(
        `❌ [${pingTime.toISOString()}] Ping cron failed:`,
        error.message,
      );
    }
  });

  console.log(`⏰ Ping cron job scheduled to run every 2 minutes`);
});
