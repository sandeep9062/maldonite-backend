// controllers/quoteRequestController.js
import QuoteRequest from "../models/QuoteRequest.js";
import axios from "axios";

// Create a new quote request
export const createQuoteRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      projectType,
      description,
      budget,
      timeline,
      recaptchaToken,
    } = req.body;

    console.log("=== Quote Request Submission ===");
    console.log("Form data:", {
      name,
      email,
      phone,
      projectType,
      description,
      budget,
      timeline,
    });
    console.log("reCAPTCHA token:", recaptchaToken);

    if (!recaptchaToken) {
      console.log("❌ reCAPTCHA token missing");
      return res
        .status(400)
        .json({ success: false, message: "reCAPTCHA token missing" });
    }

    // ✅ Verify reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

    console.log(
      "Verifying reCAPTCHA with secret key:",
      secretKey ? "****" : "missing",
    );

    const response = await axios.post(
      googleVerifyUrl,
      {},
      {
        params: {
          secret: secretKey,
          response: recaptchaToken,
        },
      },
    );

    console.log("reCAPTCHA verification response:", response.data);

    if (!response.data.success) {
      console.log("❌ reCAPTCHA verification failed");
      console.log("Error codes:", response.data["error-codes"]);
      return res.status(400).json({
        success: false,
        message: "Failed reCAPTCHA verification",
        errors: response.data["error-codes"],
      });
    }

    console.log("✅ reCAPTCHA verification successful");

    const files = req.files
      ? req.files.map((file) => file.path || file.url) // handling multer/cloudinary
      : [];

    // ✅ Save quote request to DB
    const newRequest = new QuoteRequest({
      name,
      email,
      phone,
      projectType,
      description,
      budget,
      timeline,
      files,
      recaptchaToken,
    });

    await newRequest.save();

    console.log("✅ Quote request saved to database");

    res.status(201).json({
      success: true,
      message: "Quote request submitted successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error creating quote request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all quote requests
export const getAllQuoteRequests = async (req, res) => {
  try {
    const requests = await QuoteRequest.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching quote requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single quote request by ID
export const getQuoteRequestById = async (req, res) => {
  try {
    const request = await QuoteRequest.findById(req.params.id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Quote request not found" });
    }
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error fetching quote request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update quote request
export const updateQuoteRequest = async (req, res) => {
  try {
    const updatedRequest = await QuoteRequest.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Quote request not found" });
    }

    res.status(200).json({
      success: true,
      message: "Quote request updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating quote request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete quote request
export const deleteQuoteRequest = async (req, res) => {
  try {
    const deleted = await QuoteRequest.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Quote request not found" });
    }

    res.status(200).json({
      success: true,
      message: "Quote request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quote request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
