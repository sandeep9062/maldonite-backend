import Contact from "../models/Contact.js";
import axios from "axios";

// ✅ Create Contact Message
export const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message, recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json({ success: false, message: "reCAPTCHA token missing" });
    }

    // ✅ Verify reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

    const response = await axios.post(
      googleVerifyUrl,
      {},
      {
        params: {
          secret: secretKey,
          response: recaptchaToken,
        },
      }
    );

    if (!response.data.success) {
      return res.status(400).json({ success: false, message: "Failed reCAPTCHA verification" });
    }

    // ✅ Save contact to DB
    const contact = new Contact({ name, email, phone, subject, message, recaptchaToken });
    await contact.save();

    res.status(201).json({ success: true, message: "Message sent successfully", contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Messages
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Message
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: "Message not found" });
    res.status(200).json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Message Status
export const updateContactStatus = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: "Message not found" });
    res.status(200).json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Message
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: "Message not found" });
    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
