// routes/quoteRequest.routes.js
import express from "express";
import {
  createQuoteRequest,
  getAllQuoteRequests,
  getQuoteRequestById,
  updateQuoteRequest,
  deleteQuoteRequest,
} from "../controllers/quoteRequestController.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

// POST - create new request
router.post("/", upload.array("files"), createQuoteRequest);

// GET - fetch all requests
router.get("/", getAllQuoteRequests);

// GET - fetch single request by id
router.get("/:id", getQuoteRequestById);

// PUT - update request by id
router.put("/:id", upload.array("files"), updateQuoteRequest);

// DELETE - delete request by id
router.delete("/:id", deleteQuoteRequest);

export default router;
