import express from "express";
import Property from "../models/Property.js"; // Ensure path and .js extension are correct

const router = express.Router();

/**
 * @route   POST /api/migrate-images
 * @desc    Renames the 'images' field to 'image' for all property documents
 * @access  Private/Admin (Recommended)
 */
router.post("/migrate", async (req, res) => {
  try {
    // 1. Rename 'images' to 'image' using MongoDB's atomic $rename operator
    // This is much faster than fetching and saving each document individually.
    const result = await Property.updateMany(
      { image: { $exists: true } }, // Only target docs that have the old key
      { $rename: { image: "media" } },
    );

    // 2. Handle cases where no documents needed updating
    if (result.matchedCount === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No documents found with the 'images' field. Migration might already be complete.",
        details: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property image fields renamed successfully.",
      details: {
        totalFound: result.matchedCount,
        totalUpdated: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Migration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during field migration.",
      error: error.message,
    });
  }
});

export default router;
