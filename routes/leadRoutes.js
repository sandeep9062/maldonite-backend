import express from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateLeadStatus,
} from "../controllers/leadController.js";

const router = express.Router();

// CRUD routes
router.post("/lead", createLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

// Status update route
router.patch("/:id/status", updateLeadStatus);

export default router;
