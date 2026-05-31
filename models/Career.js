import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      enum: ["Business & Ops", "Engineering"],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    requirements: [
      {
        type: String,
        trim: true,
      },
    ],

    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "INR",
      },
      period: {
        type: String,
        enum: ["Monthly", "Yearly", "Hourly", "Negotiable"],
        default: "Negotiable",
      },
    },

    experienceLevel: {
      type: String,
      enum: ["Fresher", "Junior", "Mid", "Senior", "Lead"],
      default: "Junior",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    applicationDeadline: {
      type: Date,
    },

    benefits: [
      {
        type: String,
        trim: true,
      },
    ],

    seo: {
      metaTitle: String,
      metaDescription: String,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Career = mongoose.models.Career || mongoose.model("Career", careerSchema);

export default Career;
