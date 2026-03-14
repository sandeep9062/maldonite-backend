import NewsLetter from "../models/NewsLetter.js";

// @desc    Subscribe a user to the newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Basic validation: Check if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // 2. Check if the email already exists to prevent duplicates
    const existingSubscriber = await NewsLetter.findOne({ email });
    if (existingSubscriber) {
      return res
        .status(409)
        .json({ message: "This email is already subscribed." });
    }

    // 3. Create a new newsletter document
    const newSubscriber = await NewsLetter.create({ email });

    // 4. Respond with a success message
    res.status(201).json({
      message: "Subscription successful!",
      data: newSubscriber,
    });
  } catch (error) {
    // Handle validation errors or other server errors
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong.", error: error.message });
  }
};

// @desc    Get all subscribed emails
// @route   GET /api/newsletter/emails
// @access  Private (should be protected by an admin/auth middleware)
const getAllEmails = async (req, res) => {
  try {
    const emails = await NewsLetter.find().select("email -_id"); // Retrieve only the email field

    // Check if any emails were found
    if (emails.length === 0) {
      return res.status(404).json({ message: "No subscribed emails found." });
    }

    res.status(200).json({
      count: emails.length,
      emails: emails.map((subscriber) => subscriber.email), // Return as a simple array of strings
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong.", error: error.message });
  }
};

export { subscribeToNewsletter, getAllEmails };
