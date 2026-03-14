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
      return res
        .status(400)
        .json({ success: false, message: "Service with this slug already exists" });
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
    console.error(error);
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
      return res.status(404).json({ success: false, message: "Service not found" });

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
    const { id } = req.params;
    const updateData = {
      ...req.body,
      tags: toArray(req.body.tags),
      tools: toArray(req.body.tools),
      points: toArray(req.body.points),
      valueProvide: toArray(req.body.valueProvide),
      keywords: toArray(req.body.keywords),
    };

    // File updates
    if (req.files?.image?.[0]?.path) updateData.image = req.files.image[0].path;
    if (req.files?.serviceImage?.[0]?.path) updateData.serviceImage = req.files.serviceImage[0].path;

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedService = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedService)
      return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, service: updatedService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
