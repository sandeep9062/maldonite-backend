import express from "express";
import {
  subscribeToNewsletter,
  getAllEmails,
} from "../controllers/newsLetterController.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Define the POST route for subscribing to the newsletter
router.post("/subscribe", subscribeToNewsletter);

// Define the GET route to get all emails
// NOTE: In a production application, this route must be protected
// by authentication and authorization middleware (e.g., only for admins).
router.get("/emails", protect, checkAdmin, getAllEmails);

export default router;
