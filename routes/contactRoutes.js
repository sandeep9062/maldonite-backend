import express from "express";
import {
  createContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
} from "../controllers/contactController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

// ✅ Routes
router.post("/", createContact); // Submit message with reCAPTCHA
router.get("/", protect, checkAdmin, getContacts); // Get all messages
router.get("/:id", protect, checkAdmin, getContactById); // Get single message
router.put("/:id", protect, checkAdmin, updateContactStatus); // Update message status (new, read, archived)
router.delete("/:id", protect, checkAdmin, deleteContact); // Delete message

export default router;
