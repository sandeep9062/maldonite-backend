import mongoose from "mongoose";

// Exponential backoff cap for retries after a failed initial connection.
const MAX_RETRY_DELAY_MS = 30_000;
let attempt = 0;

// Attach connection event listeners ONCE at module load (before any connect
// attempt) so early error/disconnect events are never missed, and so retries
// don't stack duplicate listeners.
mongoose.connection.on("error", (err) => {
  console.error(
    `❌ MongoDB connection error: ${err.message} (retrying via driver keep-alive)`,
  );
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Mongoose will keep buffering ops until reconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

mongoose.connection.on("connected", () => {
  console.log(`✅ MONGODB Connected: ${mongoose.connection.host}`);
});

/**
 * Connect to MongoDB WITHOUT blocking server startup.
 *
 * This runs fire-and-forget from app.js: the HTTP server starts listening
 * immediately even if the network/DB is still warming up. Because
 * `bufferCommands` is true, Mongoose queues model operations until the
 * connection is ready instead of failing or stalling the request path.
 *
 * On failure we log a warning and schedule a bounded retry with exponential
 * backoff — we deliberately do NOT `process.exit(1)`, so a cold boot where
 * Mongo is briefly unreachable still brings the web process up instantly
 * and lets /health and /ping answer.
 */
const connectDB = async () => {
  attempt += 1;

  try {
    const conn = await mongoose.connect(process.env.MONGO_DB, {
      // Connection pool settings for optimal performance
      maxPoolSize: 10,
      minPoolSize: 2,
      // Keep-alive settings — helps short-window reconnects after Render
      // sleep cycles instead of letting idle sockets go stale.
      heartbeatFrequencyMS: 10_000,
      maxIdleTimeMS: 60_000,
      // Socket timeout settings
      socketTimeoutMS: 45_000,
      serverSelectionTimeoutMS: 5_000,
      // Retry writes for transient errors
      retryWrites: true,
      w: "majority",
      // Non-blocking boot: queue model operations while not yet connected
      // so the first requests never hang on connection setup.
      bufferCommands: true,
      // Skip index builds at boot in production (they delay startup and can
      // block queries); override with MONGO_AUTO_INDEX=true when needed.
      autoIndex:
        process.env.MONGO_AUTO_INDEX === "true" ||
        process.env.NODE_ENV !== "production",
    });

    // Reset the attempt counter after a successful (re)connect.
    // (A "MONGODB Connected" line is already logged by the `connected` event
    // listener registered above.)
    attempt = 0;
    return conn;
  } catch (error) {
    // Do NOT exit — the web server is already up and serving /health and
    // /ping; model operations are buffered until we reconnect.
    const delayMs = Math.min(1_000 * 2 ** Math.max(attempt - 1, 0), MAX_RETRY_DELAY_MS);
    console.error(
      `❌ MONGODB Failed to Connect (attempt ${attempt}): ${error.message} — ` +
        `retrying in ${Math.round(delayMs / 1000)}s`,
    );
    setTimeout(connectDB, delayMs);
    return null;
  }
};

export default connectDB;
