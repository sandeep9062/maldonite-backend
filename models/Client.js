import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email"],
    },
    phone: { type: String },
    website: { type: String },
    industry: { type: String },
    address: { type: String },
    description: { type: String },
    icon: { type: String }, // Cloudinary URL for icon/logo
  },
  { timestamps: true }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;
