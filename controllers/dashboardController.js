import Blog from "../models/Blog.js";
import Contact from "../models/Contact.js";
import Lead from "../models/Lead.js";
import QuoteRequest from "../models/QuoteRequest.js";
import NewsLetter from "../models/NewsLetter.js";

// Get dashboard stats with parallel queries and lean
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalBlogs,
      totalContacts,
      totalLeads,
      totalQuoteRequests,
      totalSubscribers,
      recentContacts,
      recentLeads,
      recentQuotes,
    ] = await Promise.all([
      Blog.countDocuments(),
      Contact.countDocuments(),
      Lead.countDocuments(),
      QuoteRequest.countDocuments(),
      NewsLetter.countDocuments(),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email message createdAt")
        .lean()
        .maxTimeMS(3000),
      Lead.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email phone budget status createdAt")
        .lean()
        .maxTimeMS(3000),
      QuoteRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email service budget timeline createdAt")
        .lean()
        .maxTimeMS(3000),
    ]);

    res.status(200).json({
      totalBlogs,
      totalContacts,
      totalLeads,
      totalQuoteRequests,
      totalSubscribers,
      recentContacts,
      recentLeads,
      recentQuotes,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
