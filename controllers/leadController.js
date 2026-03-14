import Lead from "../models/Lead.js";
import axios from "axios";

// Create a new lead
export const createLead = async (req, res) => {
  try {
    const { name, email, query, recaptchaToken } = req.body;

    console.log("=== Lead Form Submission ===");
    console.log("Form data:", { name, email, query });
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

    // ✅ Save lead to DB
    const lead = new Lead({
      name,
      email,
      query,
      recaptchaToken,
    });
    const savedLead = await lead.save();

    console.log("✅ Lead saved to database");

    res.status(201).json(savedLead);
  } catch (error) {
    console.error("❌ Lead form submission error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get all leads
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single lead by ID
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
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
    });
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
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);
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
      { new: true },
    );
    if (!updatedLead)
      return res.status(404).json({ message: "Lead not found" });
    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
