import mongoose from "mongoose";

const pingLogSchema = new mongoose.Schema(
  {
    pingTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    responseTime: {
      type: Number, // Response time in milliseconds
      required: false,
    },
    message: {
      type: String,
      required: false,
    },
    serverUrl: {
      type: String,
      required: false,
    },
    statusCode: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

// Index for efficient querying by ping time
pingLogSchema.index({ pingTime: -1 });
pingLogSchema.index({ status: 1 });

export default mongoose.model("PingLog", pingLogSchema);