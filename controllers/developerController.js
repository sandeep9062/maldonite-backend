import Developer from "../models/Developer.js";
import Project from "../models/Project.js";

// @desc    Get all developers with project counts
export const getDevelopers = async (req, res) => {
  try {
    const developers = await Developer.find().sort({ name: 1 });
    res.status(200).json(developers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single developer and their projects
export const getDeveloperById = async (req, res) => {
  try {
    const developer = await Developer.findById(req.params.id);
    if (!developer)
      return res.status(404).json({ message: "Developer not found" });

    // Fetch all projects belonging to this developer
    const projects = await Project.find({ developer: req.params.id });

    res.status(200).json({ developer, projects });
  } catch (error) {
    res.status(400).json({ message: "Invalid Developer ID" });
  }
};

// @desc    Create a Developer profile (Admin)
export const createDeveloper = async (req, res) => {
  try {
    const { name, logo, description, website } = req.body;

    const developerExists = await Developer.findOne({ name });
    if (developerExists)
      return res.status(400).json({ message: "Developer already exists" });

    const developer = await Developer.create({
      name,
      logo,
      description,
      website,
    });
    res.status(201).json(developer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update Developer details
export const updateDeveloper = async (req, res) => {
  try {
    const developer = await Developer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json(developer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete Developer
export const deleteDeveloper = async (req, res) => {
  try {
    await Developer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Developer profile removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
