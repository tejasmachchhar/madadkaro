const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, parentCategory } = req.body;
  
  // Create slug from name (lowercase, replace spaces with hyphens)
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  
  // Check if category with this name or slug already exists
  const existingCategory = await Category.findOne({ 
    $or: [{ name }, { slug }]
  });
  
  if (existingCategory) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }
  
  // If parentCategory is provided, verify it exists
  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      res.status(400);
      throw new Error('Parent category not found');
    }
    
    // Make sure the parent doesn't have a parent itself (max 2 levels)
    if (parent.parentCategory) {
      res.status(400);
      throw new Error('Cannot create nested subcategory. Only two levels are allowed.');
    }
  }
  
  const category = await Category.create({
    name,
    slug,
    description,
    icon,
    parentCategory: parentCategory || null
  });
  
  res.status(201).json(category);
});

// @desc    Get all categories with their subcategories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  // Get only main categories (those without a parent)
  const categories = await Category.find({ parentCategory: null, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description icon priceRange'
    });
  
  res.status(200).json(categories);
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description icon'
    });
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  res.status(200).json(category);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, isActive, priceRange } = req.body;
  
  let updateData = {};
  
  if (name) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
  }
  
  if (description !== undefined) updateData.description = description;
  if (icon !== undefined) updateData.icon = icon;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (priceRange !== undefined) updateData.priceRange = priceRange;
  
  // Find the category and update it
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Update and return the updated category
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  ).populate({
    path: 'subcategories',
    select: 'name slug description icon isActive priceRange'
  });
  
  res.status(200).json(updatedCategory);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Check if it has subcategories
  const hasSubcategories = await Category.exists({ parentCategory: req.params.id });
  
  if (hasSubcategories) {
    res.status(400);
    throw new Error('Cannot delete category with subcategories. Delete subcategories first or set them to inactive.');
  }
  
  await category.deleteOne();
  
  res.status(200).json({ message: 'Category deleted successfully' });
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
}; 