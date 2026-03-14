// controllers/quoteRequestController.js
import QuoteRequest from "../models/QuoteRequest.js";

// Create a new quote request
export const createQuoteRequest = async (req, res) => {
  try {
    const { name, email, phone, projectType, description, budget, timeline } =
      req.body;

    const files = req.files
      ? req.files.map((file) => file.path || file.url) // handling multer/cloudinary
      : [];

    const newRequest = new QuoteRequest({
      name,
      email,
      phone,
      projectType,
      description,
      budget,
      timeline,
      files,
    });

    await newRequest.save();
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
      { new: true, runValidators: true }
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
