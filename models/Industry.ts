import mongoose from "mongoose";

// Sub-schema for structured lists like "Why Choose Us" or "Service Benefits"
const PointSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const industrySchema = new mongoose.Schema(
  {
    // --- CORE IDENTIFICATION ---
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String, // e.g., "Healthcare", "E-commerce", "Finance"
      required: true,
    },

    // --- DESCRIPTIONS ---
    shortDesc: {
      type: String,
      required: true,
    },
    longDesc: {
      type: String,
      required: true,
    },

    // --- MEDIA ---
    icon: {
      type: String, // CSS class or Lucide icon string
    },
    heroImage: {
      type: String, // Main image for the industry page
    },
    thumbnailImage: {
      type: String, // Smaller image for the grid view
    },

    // --- SERVICE DETAILS ---
    points: [PointSchema], // Array of structured benefit points
    valueProvide: {
      type: [String], // Simple array for bullet points
    },
    tools: {
      type: [String], // Tech stack (e.g., ["React", "AWS", "Python"])
    },
    targetAudience: {
      type: [String], // Array instead of string for better filtering
    },
    
    // --- BUSINESS & CTA ---
    featured: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: String, // e.g., "4-8 weeks"
    },
    pricingRange: {
      type: String, // e.g., "Starting from $5000"
    },
    ctaText: {
      type: String,
      default: "Consult Now",
    },

    // --- SEO & METADATA ---
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    keywords: {
      type: [String],
    },
    tags: {
      type: [String],
    },
  },
  { 
    timestamps: true // Automatically creates 'createdAt' and 'updatedAt'
  }
);

// Middleware to ensure slug is generated if missing (Optional)
industrySchema.pre("save", async function () {
  if (this.title && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/ /g, "-");
  }
});

const Industry =
  mongoose.models.Industry || mongoose.model("Industry", industrySchema);

export default Industry;
