import express from "express";
import { createEnquiry,getAllEnquiries } from "../controllers/enquiryController.js";

const router = express.Router();

router.post("/", createEnquiry);        
router.get("/", getAllEnquiries);   

export default router;
