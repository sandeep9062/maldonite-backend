import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Person giving testimonial
    },
    designation: {
      type: String, // e.g., CEO, Manager, etc.
    },
    company: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5, // Optional rating system
    },
    image: {
      type: String, // Cloudinary image URL (profile picture)
    },
    icon: {
      type: String, // Cloudinary image URL Optional: company logo or other icon
    },
    location: {
      type: String, // e.g., New York, India
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
