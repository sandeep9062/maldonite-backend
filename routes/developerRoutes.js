import express from "express";
const router = express.Router();
import {
  getDevelopers,
  createDeveloper,
  getDeveloperById,
  updateDeveloper,
  deleteDeveloper,
} from "../controllers/developerController.js";

// Import your existing auth middlewares
// import { protect, admin } from '../middleware/authMiddleware.js';

router
  .route("/")
  .get(getDevelopers) // Public: Show all builders in Tricity
  .post(createDeveloper); // Admin Only: Register a new builder brand

router
  .route("/:id")
  .get(getDeveloperById) // Public: Detailed brand page
  .put(updateDeveloper) // Admin/Owner: Edit brand info
  .delete(deleteDeveloper); // Admin Only

export default router;
