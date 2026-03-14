import Testimonial from "../models/Testimonial.js";

// ✅ Create Testimonial
export const createTestimonial = async (req, res) => {
  try {
    const { name, designation, company, message, rating, location } = req.body; // 'icon' will now come from req.files if it's a file

    let imageUrl = null;
    let iconUrl = null;

    // Multer's upload.fields() stores files in req.files object, where each key is the field name
    // Check if an 'image' file was uploaded
    if (req.files && req.files.image && req.files.image.length > 0) {
      imageUrl = req.files.image[0].path; // Cloudinary URL from multer for the 'image' file
    }

    // Check if an 'icon' file was uploaded
    if (req.files && req.files.icon && req.files.icon.length > 0) {
      iconUrl = req.files.icon[0].path; // Cloudinary URL from multer for the 'icon' file
    } else if (req.body.icon && typeof req.body.icon === "string") {
      // If no file was uploaded for icon, but a string URL was provided in the body
      iconUrl = req.body.icon;
    }

    const testimonial = new Testimonial({
      name,
      designation,
      company,
      message,
      rating,
      location,
      image: imageUrl, // Assign the uploaded image URL
      icon: iconUrl, // Assign the uploaded icon URL or string URL
    });

    await testimonial.save();
    res.status(201).json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Testimonials
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Testimonial
export const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }
    res.status(200).json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Testimonial
export const updateTestimonial = async (req, res) => {
  try {
    const { name, designation, company, message, rating, location } = req.body; // 'icon' will now come from req.files if it's a file

    let updateData = {
      name,
      designation,
      company,
      message,
      rating,
      location,
    };

    // Check if a new 'image' file was uploaded using req.files
    if (req.files && req.files.image && req.files.image.length > 0) {
      updateData.image = req.files.image[0].path; // Replace with new Cloudinary image URL
    }

    // Check if a new 'icon' file was uploaded or if an icon URL string was provided
    if (req.files && req.files.icon && req.files.icon.length > 0) {
      updateData.icon = req.files.icon[0].path; // Replace with new Cloudinary icon URL
    } else if (req.body.icon && typeof req.body.icon === "string") {
      // If no file was uploaded for icon, but a string URL was provided in the body
      updateData.icon = req.body.icon;
    } else if (req.body.icon === "") {
      // If the icon field was explicitly cleared (sent as empty string)
      updateData.icon = "";
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Testimonial
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
