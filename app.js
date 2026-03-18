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
    message: "Pong! Server is awake. MALDONITE !",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server

app.listen(PORT, async () => {
  console.log(`✅ Server Running at http://localhost:${PORT}`);

  // Setup cron job to ping the server every 2 minutes to keep it awake
  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

  // Enhanced deployment-ready ping configuration
  const PING_INTERVAL = "*/2 * * * *"; // Every 2 minutes
  const MAX_RETRIES = 3; // Maximum retry attempts
  const RETRY_DELAY = 5000; // 5 seconds between retries
  const TIMEOUT = 10000; // 10 seconds timeout for each ping

  console.log(`⏰ Ping cron job scheduled with interval: ${PING_INTERVAL}`);
  console.log(
    `🔧 Max retries: ${MAX_RETRIES}, Retry delay: ${RETRY_DELAY}ms, Timeout: ${TIMEOUT}ms`,
  );

  // Function to perform a single ping with timeout
  const performPing = async (url, timeout = TIMEOUT) => {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Ping request timed out after ${timeout}ms`));
      }, timeout);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Maldonite-KeepAlive/1.0",
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        clearTimeout(timeoutId);
        resolve(response);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  };

  // Enhanced ping function with retry logic
  const pingWithRetry = async (url) => {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const startTime = Date.now();
        const response = await performPing(url);
        const responseTime = Date.now() - startTime;
        const data = await response.json();

        // Save successful ping log to database
        const pingLog = new PingLog({
          pingTime: new Date(),
          status: "success",
          responseTime,
          message: data.message,
          serverUrl: url,
          statusCode: response.status,
          attempt: attempt,
          totalAttempts: MAX_RETRIES,
        });
        await pingLog.save();

        console.log(
          `🔄 [${new Date().toISOString()}] Ping successful: ${data.message} (${responseTime}ms) [Attempt ${attempt}/${MAX_RETRIES}]`,
        );

        return { success: true, responseTime, data };
      } catch (error) {
        lastError = error;

        // Save failed ping attempt to database
        const responseTime = Date.now() - (new Date().getTime() - 0);
        const pingLog = new PingLog({
          pingTime: new Date(),
          status: "failed",
          responseTime,
          message: `Attempt ${attempt}/${MAX_RETRIES}: ${error.message}`,
          serverUrl: url,
          statusCode: null,
          attempt: attempt,
          totalAttempts: MAX_RETRIES,
        });
        await pingLog.save();

        console.warn(
          `⚠️  [${new Date().toISOString()}] Ping attempt ${attempt}/${MAX_RETRIES} failed:`,
          error.message,
        );

        // If not the last attempt, wait before retrying
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    // All retries failed
    throw new Error(
      `All ${MAX_RETRIES} ping attempts failed. Last error: ${lastError.message}`,
    );
  };

  // Schedule the enhanced ping job
  cron.schedule(PING_INTERVAL, async () => {
    const startTime = Date.now();
    const pingTime = new Date();

    try {
      const result = await pingWithRetry(`${SERVER_URL}/api/ping`);

      // Cleanup old logs (every 30th ping or roughly every hour)
      if (new Date().getMinutes() % 30 === 0) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deletedCount = await PingLog.deleteMany({
          pingTime: { $lt: oneDayAgo },
        });
        console.log(
          `🧹 Cleaned up ${deletedCount.deletedCount} old ping logs to save space.`,
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Save final failure log
      const pingLog = new PingLog({
        pingTime,
        status: "failed",
        responseTime,
        message: `CRITICAL: ${error.message}`,
        serverUrl: SERVER_URL,
        statusCode: null,
        attempt: MAX_RETRIES,
        totalAttempts: MAX_RETRIES,
        isCritical: true,
      });
      await pingLog.save();

      console.error(
        `❌ [${pingTime.toISOString()}] CRITICAL: All ping attempts failed:`,
        error.message,
      );

      // In production, you might want to trigger additional alerts here
      if (process.env.NODE_ENV === "production") {
        console.error(
          `🚨 [${pingTime.toISOString()}] PRODUCTION ALERT: Server ping failed completely!`,
        );
      }
    }
  });

  // Additional keep-alive measures for deployment
  if (process.env.NODE_ENV === "production") {
    // 1. Add a secondary ping every 5 minutes as backup
    cron.schedule("*/5 * * * *", async () => {
      try {
        await fetch(`${SERVER_URL}/api/ping`, {
          headers: { "User-Agent": "Maldonite-Backup-KeepAlive/1.0" },
        });
      } catch (error) {
        console.warn(`Backup ping failed: ${error.message}`);
      }
    });

    // 2. Health check endpoint for monitoring services
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
      });
    });

    console.log(`🏥 Health check endpoint available at ${SERVER_URL}/health`);
  }
});
