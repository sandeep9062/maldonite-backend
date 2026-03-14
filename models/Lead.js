import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10,15}$/, "Please enter a valid phone number"],
    },
    projectType: { type: String, required: true, trim: true },
    requirements: { type: String, trim: true, default: "" },
    budget: { type: String, trim: true, default: "" },
    timeline: { type: String, trim: true, default: "" },
    recaptchaToken: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "interested",
        "proposal_sent",
        "negotiation",
        "converted",
        "lost",
      ],
      default: "new",
    },
  },
  { timestamps: true },
);

// Static method to update status
leadSchema.statics.updateStatus = async function (id, newStatus) {
  return this.findByIdAndUpdate(id, { status: newStatus }, { new: true });
};

export default mongoose.models.Lead || mongoose.model("Lead", leadSchema);
