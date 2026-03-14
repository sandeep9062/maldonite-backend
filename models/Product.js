import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      unique: true, // ✅ Ensure slug is unique
    },

    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, required: true },

    tagline: { type: String },

    technologies: [{ type: String }],
    features: [{ type: String }],
    specialFeature: { type: String },

    version: { type: String, default: "1.0" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    pricingModel: {
      type: String,
      enum: ["Free", "Subscription", "One-time"],
      default: "Subscription",
    },
    license: { type: String, default: "Proprietary" },
    support: { type: String, default: "Email & Chat Support" },
    demoUrl: { type: String },
    documentationUrl: { type: String },
    githubRepo: { type: String },
    launchDate: { type: Date },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;