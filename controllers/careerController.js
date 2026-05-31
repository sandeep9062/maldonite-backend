import Career from "../models/Career.js";

// Create a new job listing
export const createCareer = async (req, res) => {
  try {
    const career = new Career(req.body);
    await career.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Job listing created successfully",
        career,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all active job listings (public)
export const getCareers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isActive: true, isPublished: true };

    if (req.query.department) {
      filter.department = req.query.department;
    }

    const [careers, total] = await Promise.all([
      Career.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(5000),
      Career.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      careers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all job listings (admin - includes inactive)
export const getAllCareersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [careers, total] = await Promise.all([
      Career.find()
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(5000),
      Career.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      careers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single job listing by ID
export const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id).lean().maxTimeMS(5000);
    if (!career)
      return res
        .status(404)
        .json({ success: false, message: "Job listing not found" });
    res.status(200).json({ success: true, career });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update job listing
export const updateCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .lean()
      .maxTimeMS(5000);

    if (!career)
      return res
        .status(404)
        .json({ success: false, message: "Job listing not found" });
    res
      .status(200)
      .json({
        success: true,
        message: "Job listing updated successfully",
        career,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete job listing
export const deleteCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id)
      .lean()
      .maxTimeMS(5000);
    if (!career)
      return res
        .status(404)
        .json({ success: false, message: "Job listing not found" });
    res
      .status(200)
      .json({ success: true, message: "Job listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
