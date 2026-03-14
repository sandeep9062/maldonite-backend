import Project from "../models/Projects.js";

// A helper function to ensure a value is always an array
const toArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  // If the value is a string, split it. Otherwise, return the array.
  return Array.isArray(value)
    ? value
    : value.split(",").map((item) => item.trim());
};

// @desc   Create new project
// @route  POST /api/projects
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

    // Check for a duplicate slug before saving
    const existingProject = await Project.findOne({ slug });
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
      // ✅ Explicitly cast numeric fields
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
    console.error("Error creating project:", err); // ✅ Add server-side logging
    res.status(400).json({ message: "Invalid data", error: err.message });
  }
};

// @desc   Update project
// @route  PUT /api/projects/:id
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

    // Find the project being edited by its ID
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check for slug uniqueness, excluding the current project
    if (slug && slug !== project.slug) {
      const existingSlug = await Project.findOne({
        slug,
        _id: { $ne: req.params.id },
      });
      if (existingSlug) {
        return res
          .status(400)
          .json({ message: "Project with this slug already exists" });
      }
    }

    // Prepare the update data
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
      // ✅ Explicitly cast numeric fields
      cost: Number(cost),
      technologiesUsed: toArray(technologiesUsed),
      deployment,
      features: toArray(features),
      specialFeature,
      numberOfPages: Number(numberOfPages),
    };

    // Process new images from Multer
    const newImages = req.files ? req.files.map((file) => file.path) : [];

    // Combine the existing images (sent from frontend) with the new images
    const keptImages = toArray(existingImages);
    updateData.image = [...keptImages, ...newImages];

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProject);
  } catch (err) {
    console.error("Error updating project:", err); // ✅ Add server-side logging
    res.status(400).json({ message: "Update failed", error: err.message });
  }
};

// @desc   Get all projects
// @route  GET /api/projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Get single project by ID
// @route  GET /api/projects/:id
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Get single project by Slug
// @route  GET /api/projects/slug/:slug
export const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Delete project
// @route  DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject)
      return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};
