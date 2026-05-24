import Blog from "../models/Blog.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Create Blog - Now expects slug from the frontend
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      desc,
      content,
      category,
      tags,
      author,
      seoMetaTitle,
      seoMetaDescription,
      status,
      date,
      readTime,
      isFeatured,
    } = req.body;

    const blogImageUrl =
      req.files && req.files.image ? req.files.image[0].path : null;
    const authorImageUrl =
      req.files && req.files.authorImage ? req.files.authorImage[0].path : null;

    // Check if a blog with the same slug already exists
    const existingBlog = await Blog.findOne({ slug })
      .select("_id")
      .lean()
      .maxTimeMS(3000);
    if (existingBlog) {
      return res
        .status(409)
        .json({
          success: false,
          message: "A blog with this slug already exists.",
        });
    }

    const blog = new Blog({
      title,
      slug,
      desc,
      content,
      image: blogImageUrl,
      category,
      tags,
      author,
      authorImage: authorImageUrl,
      date: date || new Date(),
      readTime: readTime || 5,
      isFeatured: isFeatured || false,
      seoMetaTitle,
      seoMetaDescription,
      status,
    });

    await blog.save();
    res.status(201).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Blogs with pagination
export const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { status } : {};

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "title slug desc image category tags author date readTime views likes isFeatured status createdAt",
        )
        .lean()
        .maxTimeMS(5000),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Blog by ID
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid blog ID" });
    }
    const blog = await Blog.findById(id).lean().maxTimeMS(5000);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Blog by Slug
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug }).lean().maxTimeMS(5000);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      desc,
      content,
      category,
      tags,
      author,
      seoMetaTitle,
      seoMetaDescription,
      status,
      date,
      readTime,
      isFeatured,
    } = req.body;

    const blog = await Blog.findById(id)
      .select("slug image authorImage")
      .lean()
      .maxTimeMS(5000);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Check for slug uniqueness if it's being updated
    if (slug && slug !== blog.slug) {
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: id } })
        .select("_id")
        .lean()
        .maxTimeMS(3000);
      if (existingBlog) {
        return res
          .status(409)
          .json({
            success: false,
            message: "A blog with this new slug already exists.",
          });
      }
    }

    const updateData = {
      title,
      slug,
      desc,
      content,
      category,
      tags,
      author,
      seoMetaTitle,
      seoMetaDescription,
      status,
      date,
      readTime,
      isFeatured,
    };

    if (req.files && req.files.image) {
      if (blog.image) {
        fs.unlink(path.join(blog.image), (err) => {
          if (err) console.error("Error deleting old image:", err.message);
        });
      }
      updateData.image = req.files.image[0].path;
    }

    if (req.files && req.files.authorImage) {
      if (blog.authorImage) {
        fs.unlink(path.join(blog.authorImage), (err) => {
          if (err)
            console.error("Error deleting old author image:", err.message);
        });
      }
      updateData.authorImage = req.files.authorImage[0].path;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .lean()
      .maxTimeMS(5000);

    res.status(200).json({ success: true, blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Blog
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).maxTimeMS(5000);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Delete associated images
    if (blog.image) {
      fs.unlink(path.join(blog.image), (err) => {
        if (err) console.error("Error deleting blog image:", err.message);
      });
    }
    if (blog.authorImage) {
      fs.unlink(path.join(blog.authorImage), (err) => {
        if (err) console.error("Error deleting author image:", err.message);
      });
    }

    await Blog.findByIdAndDelete(req.params.id).maxTimeMS(5000);

    res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Blog Image
export const deleteBlogImage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).maxTimeMS(5000);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    if (blog.image) {
      fs.unlink(path.join(blog.image), async (err) => {
        if (err) {
          console.error("Error deleting image file:", err.message);
          return res
            .status(500)
            .json({ success: false, message: "Failed to delete image file" });
        }
        blog.image = null;
        await blog.save();
        res
          .status(200)
          .json({ success: true, message: "Blog image deleted successfully" });
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "No blog image to delete" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { name, email, comment } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { name, email, comment } } },
      { new: true },
    )
      .select("comments")
      .lean()
      .maxTimeMS(5000);

    if (!updatedBlog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    res.status(201).json({ success: true, comments: updatedBlog.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
