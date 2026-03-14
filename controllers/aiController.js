import {
  generatePropertyDescription,
  generateSeoMeta,
  generateMatchScore,
  generateLocalityGuide,
  extractPropertyDetails,
} from "../services/ai/index.js";

export const generatePropertyDescriptionController = async (req, res) => {
  const description = await generatePropertyDescription(req.body);
  res.json({ success: true, description });
};

export const generatePropertyDetailsController = async (req, res) => {
  const details = await extractPropertyDetails(req.body.text);
  res.json({ success: true, data: details });
};

export const generateSeoMetaController = async (req, res) => {
  const meta = await generateSeoMeta(req.body);
  res.json({ success: true, meta });
};

export const generateMatchScoreController = async (req, res) => {
  const result = await generateMatchScore(req.body);
  res.json({ success: true, result });
};

export const generateLocalityGuideController = async (req, res) => {
  const content = await generateLocalityGuide(req.body);
  res.json({ success: true, content });
};
