// models/SiteSettings.js
import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      required: true,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid website URL"],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    mainOffice: {
      type: String,
      required: true,
      trim: true,
    },

    googleMapUrl: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\//, "Invalid Map URL"],
    },

    googleMapImbededUrl: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\//, "Invalid Map URL"],
    },

    branchOffice: {
      type: String,
      required: true,
      trim: true,
    },
    contactNo1: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?\d{7,15}$/, "Invalid contact number"],
    },
    whatsAppNo: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?\d{7,15}$/, "Invalid whatsApp number"],
    },

    contactNo2: {
      type: String,
      trim: true,
      match: [/^\+?\d{7,15}$/, "Invalid contact number"],
    },
    GSTNO: {
      type: String,
      uppercase: true,
      trim: true,
    },
    accountName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    IFSCcode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },

    // 🔹 Branding & Media
    logoUrl: { type: String, default: "", trim: true },
    bannerUrl: { type: String, default: "", trim: true },
    favicon: { type: String, default: "", trim: true },

    // 🔹 Stats / Achievements
    clientsServed: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    industriesServed: { type: Number, default: 0 },
    aiIntegrations: { type: Number, default: 0 },
    countriesReached: { type: Number, default: 0 },
    foundedIn: { type: Number }, // e.g. 2015
    SAASProducts: { type: Number, default: 0 },

    // 🔹 Company Info
    language: { type: String, trim: true }, // e.g. English, Hindi
    country: { type: String, trim: true }, // e.g. India, USA

    // 🔹 Social Media
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid LinkedIn URL"],
    },
    pinterest: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid Pinterest URL"],
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid Twitter URL"],
    },
    github: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid GitHub URL"],
    },
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid Facebook URL"],
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid Instagram URL"],
    },
    youtubeUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, "Invalid YouTube URL"],
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", siteSettingsSchema);
