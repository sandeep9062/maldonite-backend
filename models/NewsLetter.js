import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email"],
    },
  }, // This comma was missing to separate the schema definition from the options.
  { timestamps: true }
);

// The variable name "clientSchema" was a typo; it should be "newsletterSchema".
const NewsLetter = mongoose.model("NewsLetter", newsletterSchema);

export default NewsLetter;
