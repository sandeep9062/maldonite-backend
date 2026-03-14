import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import upload from "../middlewares/multer.js";
import { checkAdmin, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Routes
router.post("/", protect, checkAdmin, upload.single("logo"), createClient); // Upload client icon/logo
router.get("/", getClients);
router.get("/:id", getClientById);
router.put("/:id", protect, checkAdmin, upload.single("logo"), updateClient); // Update with/without new icon
router.delete("/:id", protect, checkAdmin, deleteClient);

export default router;
