import Project from "../models/Projects.js";

const toArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return Array.isArray(value)
    ? value
    : value.split(",").map((item) => item.trim());
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const {
      title,
      slug,
      live,
      type,
      github,
      description,
      clientName,
      place,
      timeDuration,
      cost,
      technologiesUsed,
      deployment,
      features,
      specialFeature,
      numberOfPages,
    } = req.body;

    const existingProject = await Project.findOne({ slug })
      .select("_id")
      .lean()
      .maxTimeMS(3000);
    if (existingProject) {
      return res
        .status(400)
        .json({ message: "Project with this slug already exists" });
    }

    const images = req.files ? req.files.map((file) => file.path) : [];

    const newProject = new Project({
      title,
      slug,
      live,
      type,
      github,
      description,
      clientName,
      place,
      timeDuration,
      cost: Number(cost),
      technologiesUsed: toArray(technologiesUsed),
      deployment,
      features: toArray(features),
      specialFeature,
      numberOfPages: Number(numberOfPages),
      image: images,
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    console.error("Error creating project:", err.message);
    res.status(400).json({ message: "Invalid data", error: err.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const {
      title,
      slug,
      live,
      type,
      github,
      description,
      clientName,
      place,
      timeDuration,
      cost,
      technologiesUsed,
      deployment,
      features,
      specialFeature,
      numberOfPages,
      existingImages,
    } = req.body;

    const project = await Project.findById(req.params.id)
      .select("slug image")
      .lean()
      .maxTimeMS(5000);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (slug && slug !== project.slug) {
      const existingSlug = await Project.findOne({
        slug,
        _id: { $ne: req.params.id },
      })
        .select("_id")
        .lean()
        .maxTimeMS(3000);
      if (existingSlug) {
        return res
          .status(400)
          .json({ message: "Project with this slug already exists" });
      }
    }

    const updateData = {
      title,
      slug,
      live,
      type,
      github,
      description,
      clientName,
      place,
      timeDuration,
      cost: Number(cost),
      technologiesUsed: toArray(technologiesUsed),
      deployment,
      features: toArray(features),
      specialFeature,
      numberOfPages: Number(numberOfPages),
    };

    const newImages = req.files ? req.files.map((file) => file.path) : [];
    const keptImages = toArray(existingImages);
    updateData.image = [...keptImages, ...newImages];

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    )
      .lean()
      .maxTimeMS(5000);

    res.status(200).json(updatedProject);
  } catch (err) {
    console.error("Error updating project:", err.message);
    res.status(400).json({ message: "Update failed", error: err.message });
  }
};

// Get all projects with pagination
export const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "title slug live type description clientName technologiesUsed image createdAt",
        )
        .lean()
        .maxTimeMS(5000),
      Project.countDocuments(),
    ]);

    res.status(200).json({
      projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .lean()
      .maxTimeMS(5000);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single project by Slug
export const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug })
      .lean()
      .maxTimeMS(5000);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id)
      .lean()
      .maxTimeMS(5000);
    if (!deletedProject)
      return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};
