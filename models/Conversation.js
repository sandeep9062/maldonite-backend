import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    messages: [
      {
        sender: { type: String, enum: ["user", "bot"], required: true },
        text: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
