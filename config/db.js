import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_DB, {
      // Connection pool settings for optimal performance
      maxPoolSize: 10,
      minPoolSize: 2,
      // Socket timeout settings
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      // Retry writes for transient errors
      retryWrites: true,
      w: "majority",
    });

    console.log(`✅ MONGODB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
  } catch (error) {
    console.error("❌ MONGODB Failed to Connect:", error.message);
    process.exit(1);
  }
};

export default connectDB;
