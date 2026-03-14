// models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    live: { type: String },
    type: { type: String, required: true },

    github: { type: String },
    description: { type: String, required: true },

    clientName: { type: String }, // ✅ Client name
    place: { type: String }, // ✅ Place (City/Region)
    timeDuration: { type: String }, // ✅ Duration (e.g. "3 months")
    cost: { type: Number }, // ✅ Cost or budget
    technologiesUsed: [{ type: String }], // ✅ Array of technologies
    deployment: { type: String }, // ✅ Deployment URL or platform
    features: [{ type: String }], // ✅ List of features
    specialFeature: { type: String }, // ✅ Highlighted unique feature
    numberOfPages: { type: Number }, // ✅ For websites / apps
    image: [{ type: String }], // ✅ Array of image URLs
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema);
