import Service from "../models/Services.js";

// ✅ Helper to ensure value is always an array
const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

// =============================
// CREATE SERVICE
// =============================
export const createService = async (req, res) => {
  try {
    const {
      slug,
      title,
      desc,
      longDesc,
      tags,
      icon,
      category,
      featured,
      duration,
      pricing,
      cta,
      tools,
      points,
      valueProvide,
      targetAudience,
      keywords,
    } = req.body;

    // Check if slug already exists
    const existing = await Service.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Service with this slug already exists",
      });
    }

    const service = new Service({
      slug,
      title,
      desc,
      longDesc,
      tags: toArray(tags),
      icon,
      category,
      featured,
      duration,
      pricing,
      cta,
      tools: toArray(tools),
      points: toArray(points),
      valueProvide: toArray(valueProvide),
      targetAudience,
      keywords: toArray(keywords),
      image: req.files?.image?.[0]?.path || "",
      serviceImage: req.files?.serviceImage?.[0]?.path || "",
    });

    await service.save();
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// GET ALL SERVICES
// =============================
export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ title: 1 });
    res.status(200).json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// GET SERVICE BY SLUG
// =============================
export const getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const service = await Service.findOne({ slug });
    if (!service)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// UPDATE SERVICE BY ID
// =============================
export const updateService = async (req, res) => {
  try {
    console.log("=== UPDATE SERVICE DEBUG ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request headers:", req.headers);

    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    // Check if service exists
    const existingService = await Service.findById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Handle form data properly - req.body might be strings for arrays
    const updateData = {
      ...req.body,
      tags: toArray(req.body.tags),
      tools: toArray(req.body.tools),
      points: toArray(req.body.points),
      valueProvide: toArray(req.body.valueProvide),
      keywords: toArray(req.body.keywords),
    };

    console.log("Processed update data:", updateData);

    // File updates - check if files exist and have path
    if (
      req.files &&
      req.files.image &&
      req.files.image[0] &&
      req.files.image[0].path
    ) {
      updateData.image = req.files.image[0].path;
      console.log("Updated image path:", updateData.image);
    }
    if (
      req.files &&
      req.files.serviceImage &&
      req.files.serviceImage[0] &&
      req.files.serviceImage[0].path
    ) {
      updateData.serviceImage = req.files.serviceImage[0].path;
      console.log("Updated service image path:", updateData.serviceImage);
    }

    // Remove undefined fields and empty strings
    Object.keys(updateData).forEach((key) => {
      if (
        updateData[key] === undefined ||
        updateData[key] === null ||
        updateData[key] === ""
      ) {
        delete updateData[key];
      }
    });

    console.log("Final update data:", updateData);

    const updatedService = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    console.log("Updated service result:", updatedService);

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found or update failed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("=== UPDATE SERVICE ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Provide more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =============================
// DELETE SERVICE BY ID
// =============================
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedService = await Service.findByIdAndDelete(id);
    if (!deletedService)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    res
      .status(200)
      .json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
