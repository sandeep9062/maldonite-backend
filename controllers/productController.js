import Product from "../models/Product.js";

// ✅ Helper to handle array fields
const toArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return Array.isArray(value) ? value : value.split(",").map((item) => item.trim());
};

// ✅ Create Product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug, // ✅ Added slug
      category,
      description,
      link,
      tagline,
      technologies,
      features,
      specialFeature,
      version,
      status,
      pricingModel,
      license,
      support,
      demoUrl,
      documentationUrl,
      githubRepo,
      launchDate,
    } = req.body;

    const image = req.file ? req.file.path : null;
    
    // Check if the slug already exists
    if (await Product.findOne({ slug })) {
      return res.status(400).json({ message: "Product with this slug already exists" });
    }

    const newProduct = new Product({
      name,
      slug,
      category,
      description,
      image,
      link,
      tagline,
      technologies: toArray(technologies), // ✅ Use helper
      features: toArray(features), // ✅ Use helper
      specialFeature,
      version,
      status,
      pricingModel,
      license,
      support,
      demoUrl,
      documentationUrl,
      githubRepo,
      launchDate,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Get All Products
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Single Product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Single Product by Slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Product
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      slug, // ✅ Added slug
      category,
      description,
      link,
      tagline,
      technologies,
      features,
      specialFeature,
      version,
      status,
      pricingModel,
      license,
      support,
      demoUrl,
      documentationUrl,
      githubRepo,
      launchDate,
    } = req.body;

    const image = req.file ? req.file.path : req.body.image;

    // Check for slug uniqueness, excluding the current product
    if (slug && slug !== req.body.originalSlug) {
      if (await Product.findOne({ slug })) {
        return res.status(400).json({ message: "Product with this slug already exists" });
      }
    }
    
    const updateData = {
      name,
      slug,
      category,
      description,
      image,
      link,
      tagline,
      technologies: toArray(technologies), // ✅ Use helper
      features: toArray(features), // ✅ Use helper
      specialFeature,
      version,
      status,
      pricingModel,
      license,
      support,
      demoUrl,
      documentationUrl,
      githubRepo,
      launchDate,
    };
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};