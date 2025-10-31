const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Base route /api/categories
router.route('/')
  .get(getCategories)
  .post(protect, admin, createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router; 