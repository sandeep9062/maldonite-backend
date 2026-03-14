// quoteRequest.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const QuoteRequestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    projectType: { type: String, required: true }, // relates to service.slug
    description: { type: String, required: true },
    budget: {
      type: String,
      enum: [
        "500-2500",
        "2500-5000",
        "5000-10000",
        "10000-25000",
        "over-25000",
        "not-sure",
      ],
      default: "not-sure",
    },
    timeline: {
      type: String,
      enum: ["rush", "standard", "flexible", "planning"],
      required: true,
    },
    files: [{ type: String }], // file paths or cloud URLs
  },
  { timestamps: true }
);

export default mongoose.model("QuoteRequest", QuoteRequestSchema);
