import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import compression from "compression";

import connectDB from "./config/db.js";
import PingLog from "./models/PingLog.js";
import cron from "node-cron";
import { startEventLoopMonitor } from "./utils/eventLoopMonitor.js";

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

// Event loop watchdog: logs lag/freezes so event loop starvation can be
// pinpointed (distinguishes in-process blocking from host suspension).
startEventLoopMonitor();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Liveness endpoints (must be FIRST, before any heavy middleware) ────────
// These respond instantly even on a cold / waking / DB-less instance: no DB
// connection, session, auth, or body-parsing work happens on this path.

app.get("/", (req, res) => {
  res.send(`Server is running on PORT: ${PORT}`);
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/ping", (req, res) => {
  res.status(200).json({ status: "alive", timestamp: new Date() });
});

// Backward-compatible alias for monitors already pointed at /api/ping.
app.get("/api/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pong! Server is awake.",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Non-blocking initial DB connection (fire-and-forget). The HTTP server above
// starts listening immediately; Mongoose buffers model operations until the
// connection is ready, and connectDB never exits the process on failure.
connectDB();

// Compression middleware - reduces response sizes by 70-90%
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: [
      "https://maldonite.com",
      "https://www.maldonite.com",
      "https://www.dashboard.maldonite.com",
      "https://dashboard.maldonite.com",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

// Parse JSON and URL-encoded bodies with safer limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server Running at http://localhost:${PORT}`);

  // ── Keep-alive cron (in-process, NO env vars) ─────────────────────────────
  // Mirrors the reference project's pattern: ping our own /api/ping every
  // 2 minutes so the HTTP stack is exercised regularly, and persist each
  // result to PingLog for an audit trail. Every ~30th run prunes logs older
  // than 24h. All DB writes are wrapped in try/catch so a Mongo hiccup can
  // never crash the cron (or the server).
  const KEEP_ALIVE_URL = `http://localhost:${PORT}`;

  cron.schedule("*/2 * * * *", async () => {
    const startTime = Date.now();
    const pingTime = new Date();

    try {
      const response = await fetch(`${KEEP_ALIVE_URL}/api/ping`, {
        // Fail fast — the ping is best-effort; a hung request must never
        // pile up on the event loop.
        signal: AbortSignal.timeout(5000),
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      console.log(
        `🔄 [${pingTime.toISOString()}] Keep-alive ping: ${data.message} (${responseTime}ms)`,
      );

      // Persist the successful ping (best-effort — DB may be reconnecting).
      try {
        await new PingLog({
          pingTime,
          status: "success",
          responseTime,
          message: data.message,
          serverUrl: KEEP_ALIVE_URL,
          statusCode: response.status,
        }).save();
      } catch (dbErr) {
        console.error(`❌ Keep-alive DB log failed: ${dbErr.message}`);
      }

      // Roughly every 30 minutes, prune ping logs older than 24 hours.
      if (pingTime.getMinutes() % 30 === 0) {
        try {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          await PingLog.deleteMany({ pingTime: { $lt: oneDayAgo } });
          console.log("🧹 Cleaned up old keep-alive logs to save space.");
        } catch (cleanErr) {
          console.error(
            `❌ Keep-alive log cleanup failed: ${cleanErr.message}`,
          );
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(
        `❌ [${pingTime.toISOString()}] Keep-alive ping failed: ${error.message}`,
      );

      // Record the failure too (best-effort).
      try {
        await new PingLog({
          pingTime,
          status: "failed",
          responseTime,
          message: error.message,
          serverUrl: KEEP_ALIVE_URL,
          statusCode: null,
        }).save();
      } catch (dbErr) {
        console.error(`❌ Keep-alive failure log failed: ${dbErr.message}`);
      }
    }
  });

  console.log("⏰ Keep-alive cron scheduled to run every 2 minutes");
});
