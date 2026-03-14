// model/Developer.js
import mongoose from "mongoose";
const developerSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Sushma Group"
  logo: String,
  description: String,
  website: String,
  headquarters: String,
  isVerified: { type: Boolean, default: false },
  // Link to the User account(s) that can edit this profile
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});
export default mongoose.models.Developer ||
  mongoose.model("Developer", developerSchema);
