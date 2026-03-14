// src/models/WebsiteImage.js
import mongoose from "mongoose";

const WebsiteImageSchema = new mongoose.Schema(
  {
    // The public ID from the cloud service (e.g., Cloudinary)
    // This is crucial for managing, updating, and deleting the image from the cloud.
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    // The secure URL to the image, used for serving on the frontend.
    url: {
      type: String,
      required: true,
    },
    // A single descriptive name or alt text for SEO and accessibility.
    // This is a critical field for image SEO.
    altText: {
      type: String,
      trim: true,
      default: "",
    },
    // Optional context or usage of the image (e.g., 'about-page-banner', 'og-image').
    // This allows for flexible querying without a fixed enum.
    context: {
      type: String,
      trim: true,
      index: true,
    },
    // The SEO-friendly filename. This can be generated from the altText.
    // e.g., "About Us Team" -> "about-us-team.jpg"
    filename: {
      type: String,
      trim: true,
      index: true,
    },
    // A reference to the resource the image belongs to (e.g., a service or a blog post).
    // This creates a relational link in your database.
    belongsTo: {
      resourceType: {
        type: String,
        enum: ["Service", "Blog", "Page"], // Add other models as needed
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "belongsTo.resourceType", // Creates a dynamic reference
      },
    },
    // The URL of the page where the image is used.
    // This is helpful for SEO and internal linking analysis.
    pageUrl: {
      type: String,
    },
    // Dimensions of the image. Useful for preventing Cumulative Layout Shift (CLS).
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    // Optional: for sorting images within a specific resource.
    order: {
      type: Number,
      default: 0,
    },
    // Optional: a flag to easily activate/deactivate an image.
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export default mongoose.models.WebsiteImage ||
  mongoose.model("WebsiteImage", WebsiteImageSchema);
