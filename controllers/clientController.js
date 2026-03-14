import Client from "../models/Client.js";

// ✅ Create Client
export const createClient = async (req, res) => {
  try {
    const { name, email, phone, website, industry, address, description } = req.body;

    // If icon uploaded, multer-cloudinary adds file path
    const iconUrl = req.file ? req.file.path : null;

    const client = new Client({
      name,
      email,
      phone,
      website,
      industry,
      address,
      description,
      icon: iconUrl,
    });

    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all clients
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get single client
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update client
export const updateClient = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.icon = req.file.path; // Update icon if new file uploaded
    }

    const client = await Client.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!client) return res.status(404).json({ success: false, message: "Client not found" });

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete client
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });

    res.status(200).json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
