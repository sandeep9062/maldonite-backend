// src/controllers/websiteImageController.js
import WebsiteImage from "../models/WebsiteImage.js";
import { v2 as cloudinary } from "cloudinary";

// Helper function to generate a clean filename from altText
const generateFilename = (altText) => {
  if (!altText) return null;
  return altText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};

// @desc   Upload a new image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path || !req.file.filename) {
      return res.status(400).json({ success: false, message: "No file uploaded or missing file details" });
    }

    const { altText, context, order, active, pageUrl, belongsToResourceType, belongsToResourceId } = req.body;

    // Check if the file was uploaded to Cloudinary (assuming multer-storage-cloudinary)
    const publicId = req.file.filename; // Multer-storage-cloudinary often stores publicId in filename
    const url = req.file.path;

    const newImage = await WebsiteImage.create({
      publicId,
      url,
      altText,
      context,
      filename: generateFilename(altText),
      width: req.file.width,
      height: req.file.height,
      order,
      active,
      pageUrl,
      belongsTo: {
        resourceType: belongsToResourceType,
        resourceId: belongsToResourceId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: newImage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get image by context
export const getImageByContext = async (req, res) => {
  try {
    const { context } = req.params;
    const image = await WebsiteImage.findOne({ context });

    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    res.json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all images
export const getImages = async (req, res) => {
  try {
    const images = await WebsiteImage.find().sort({ order: 1 });
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update image details
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { altText, context, order, active, pageUrl, belongsToResourceType, belongsToResourceId } = req.body;
    let updateData = {
      altText,
      context,
      order,
      active,
      pageUrl,
      belongsTo: {
        resourceType: belongsToResourceType,
        resourceId: belongsToResourceId,
      },
    };

    // If a new file is uploaded, update its Cloudinary details
    if (req.file && req.file.path && req.file.filename) {
      const oldImage = await WebsiteImage.findById(id);
      if (oldImage && oldImage.publicId) {
        // Delete old image from Cloudinary
        await cloudinary.uploader.destroy(oldImage.publicId);
      }

      updateData.publicId = req.file.filename;
      updateData.url = req.file.path;
      updateData.width = req.file.width;
      updateData.height = req.file.height;
    }

    // Generate filename based on new altText if provided
    if (altText) {
      updateData.filename = generateFilename(altText);
    }

    const updatedImage = await WebsiteImage.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedImage) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    res.json({
      success: true,
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete image
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedImage = await WebsiteImage.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    // Delete the image from Cloudinary as well
    if (deletedImage.publicId) {
      await cloudinary.uploader.destroy(deletedImage.publicId);
    }

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
