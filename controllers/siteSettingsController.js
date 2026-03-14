import { SiteSettings } from "../models/SiteSettings.js";

// Get Site Settings
export const getSiteSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne();
    res.status(200).json(settings || {});
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching site settings", error: error.message });
  }
};

// Create Site Settings (only if not exists)
export const createSiteSettings = async (req, res) => {
  try {
    const existing = await SiteSettings.findOne();
    if (existing) {
      return res
        .status(400)
        .json({ message: "Settings already exist. Use update instead." });
    }

    // Prepare an object to store the data
    const settingsData = { ...req.body };

    // Check if files were uploaded and add their URLs
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        settingsData.logoUrl = req.files.logo[0].path;
      }
      if (req.files.banner && req.files.banner[0]) {
        settingsData.bannerUrl = req.files.banner[0].path;
      }
      if (req.files.favicon && req.files.favicon[0]) {
        settingsData.favicon = req.files.favicon[0].path;
      }
    }

    const settings = new SiteSettings(settingsData);
    await settings.save();
    res.status(201).json(settings);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating site settings", error: error.message });
  }
};

// Update Site Settings
export const updateSiteSettings = async (req, res) => {
  try {
    const { id } = req.params;

    // Prepare the update data. This allows for partial updates.
    const updateData = { ...req.body };

    // Check if new files were uploaded and update their URLs.
    // This is crucial to not overwrite existing URLs if no new file is uploaded.
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        updateData.logoUrl = req.files.logo[0].path;
      }
      if (req.files.banner && req.files.banner[0]) {
        updateData.bannerUrl = req.files.banner[0].path;
      }
      if (req.files.favicon && req.files.favicon[0]) {
        updateData.favicon = req.files.favicon[0].path;
      }
    }

    const settings = await SiteSettings.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.status(200).json(settings);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating site settings", error: error.message });
  }
};

// Delete Site Settings
export const deleteSiteSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await SiteSettings.findByIdAndDelete(id);

    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.status(200).json({ message: "Settings deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting site settings", error: error.message });
  }
};
