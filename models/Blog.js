import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true, // ✅ Ensure slug is unique
    },

    desc: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "All",
        "SaaS",
        "AI",
        "DevTools",
        "UI/UX",
        "Web Development",
        "Product",
        "SEO",
        "Marketing",
        "Cloud & DevOps",
        "Case Studies",
      ],
    },
    tags: {
      type: [String],
      default: ["website", "maldonite"],
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorImage: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    readTime: {
      type: Number,
      default: 5,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seoMetaTitle: {
      type: String,
      maxlength: 60,
    },
    seoMetaDescription: {
      type: String,
      maxlength: 160,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    comments: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Blog", blogSchema);
