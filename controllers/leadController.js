import Lead from "../models/Lead.js";
import axios from "axios";

// Create a new lead
export const createLead = async (req, res) => {
  try {
    const { name, email, query, recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res
        .status(400)
        .json({ success: false, message: "reCAPTCHA token missing" });
    }

    // Verify reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const params = new URLSearchParams({
      secret: secretKey,
      response: recaptchaToken,
    });

    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    if (!response.data.success) {
      return res.status(400).json({
        success: false,
        message: "Failed reCAPTCHA verification",
      });
    }

    // Save lead to DB
    const lead = new Lead({ name, email, query });
    const savedLead = await lead.save();

    res.status(201).json(savedLead);
  } catch (error) {
    console.error("Lead form submission error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Get all leads with pagination
export const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name email phone projectType budget status createdAt")
        .lean()
        .maxTimeMS(5000),
      Lead.countDocuments(),
    ]);

    res.status(200).json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single lead by ID
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).lean().maxTimeMS(5000);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lead
export const updateLead = async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .lean()
      .maxTimeMS(5000);

    if (!updatedLead)
      return res.status(404).json({ message: "Lead not found" });
    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete lead
export const deleteLead = async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id)
      .lean()
      .maxTimeMS(5000);

    if (!deletedLead)
      return res.status(404).json({ message: "Lead not found" });
    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lead status
export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    )
      .lean()
      .maxTimeMS(5000);

    if (!updatedLead)
      return res.status(404).json({ message: "Lead not found" });
    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
