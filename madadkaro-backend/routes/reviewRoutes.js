const express = require('express');
const router = express.Router();
const {
  createReview,
  getTaskerReviews,
  getMyReviews,
  getMyReceivedReviews,
  checkReview,
  getReviewById,
  getTaskerReviewStats,
  getMyReviewStats
} = require('../controllers/reviewController');
const { protect, customer } = require('../middleware/authMiddleware');

// Public Routes
router.get('/tasker/:taskerId', getTaskerReviews);
router.get('/stats/:taskerId', getTaskerReviewStats);

// Protected Routes
router.route('/')
  .post(protect, customer, createReview)
  .get(protect, getMyReviews);

router.get('/received', protect, getMyReceivedReviews);
router.get('/check-review', protect, checkReview);
router.get('/my-stats', protect, getMyReviewStats);
router.get('/:id', protect, getReviewById);

module.exports = router; 