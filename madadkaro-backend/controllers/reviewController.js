const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (customer only)
const createReview = asyncHandler(async (req, res) => {
  const { taskerId, taskId, rating, comment } = req.body;
  
  if (!taskerId || !taskId || !rating) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if the task exists and is completed
  const task = await Task.findById(taskId);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  if (task.status !== 'completed') {
    res.status(400);
    throw new Error('Can only review completed tasks');
  }
  
  // Verify the requesting user is the customer of the task
  if (task.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized - only the customer can review a task');
  }
  
  // Verify the tasker ID matches the task's assigned tasker
  if (task.assignedTo.toString() !== taskerId.toString()) {
    res.status(400);
    throw new Error('The specified tasker did not work on this task');
  }
  
  // Check if the user has already reviewed this task
  const existingReview = await Review.findOne({
    reviewer: req.user._id,
    taskId,
  });
  
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this task');
  }
  
  // Create the review
  const review = await Review.create({
    reviewer: req.user._id,
    taskerId,
    taskId,
    rating,
    comment: comment || '', // Default to empty string if not provided
    taskTitle: task.title
  });
  
  // Update tasker's average rating
  await updateTaskerRatingStats(taskerId);
  
  res.status(201).json(review);
});

// @desc    Get reviews for a specific tasker
// @route   GET /api/reviews/tasker/:taskerId
// @access  Public
const getTaskerReviews = asyncHandler(async (req, res) => {
  const { taskerId } = req.params;
  
  // Validate taskerId
  if (!mongoose.Types.ObjectId.isValid(taskerId)) {
    res.status(400);
    throw new Error('Invalid tasker ID');
  }
  
  // Check if tasker exists
  const tasker = await User.findById(taskerId);
  if (!tasker || tasker.role !== 'tasker') {
    res.status(404);
    throw new Error('Tasker not found');
  }
  
  const reviews = await Review.find({ taskerId })
    .sort({ createdAt: -1 })
    .populate('reviewer', 'name')
    .populate('taskId', 'title');
  
  // Format reviews for the frontend
  const formattedReviews = reviews.map(review => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    taskTitle: review.taskTitle || (review.taskId ? review.taskId.title : 'Unknown Task'),
    reviewerName: review.reviewer ? review.reviewer.name : 'Anonymous User',
    createdAt: review.createdAt
  }));
  
  res.json(formattedReviews);
});

// @desc    Get reviews by the logged-in user
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('taskerId', 'name')
    .populate('taskId', 'title');
  
  // Format reviews for the frontend
  const formattedReviews = reviews.map(review => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    taskTitle: review.taskTitle || (review.taskId ? review.taskId.title : 'Unknown Task'),
    taskerName: review.taskerId ? review.taskerId.name : 'Unknown Tasker',
    createdAt: review.createdAt
  }));
  
  res.json(formattedReviews);
});

// @desc    Get reviews received by the logged-in tasker
// @route   GET /api/reviews/received
// @access  Private (tasker only)
const getMyReceivedReviews = asyncHandler(async (req, res) => {
  // Check if the user is a tasker
  if (req.user.role !== 'tasker') {
    res.status(403);
    throw new Error('Not authorized - only taskers can view their received reviews');
  }
  
  const reviews = await Review.find({ taskerId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('reviewer', 'name')
    .populate('taskId', 'title');
  
  // Format reviews for the frontend
  const formattedReviews = reviews.map(review => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    taskTitle: review.taskTitle || (review.taskId ? review.taskId.title : 'Unknown Task'),
    reviewerName: review.reviewer ? review.reviewer.name : 'Anonymous User',
    createdAt: review.createdAt
  }));
  
  res.json(formattedReviews);
});

// @desc    Check if a user has reviewed a specific task
// @route   GET /api/reviews/check-review
// @access  Private
const checkReview = asyncHandler(async (req, res) => {
  const { taskId } = req.query;
  
  if (!taskId) {
    res.status(400);
    throw new Error('Task ID is required');
  }
  
  const review = await Review.findOne({
    reviewer: req.user._id,
    taskId,
  });
  
  res.json({ hasReviewed: !!review });
});

// @desc    Get a specific review by ID
// @route   GET /api/reviews/:id
// @access  Private
const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('reviewer', 'name')
    .populate('taskerId', 'name')
    .populate('taskId', 'title');
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  // Check if the user is authorized to view this review
  if (
    review.reviewer._id.toString() !== req.user._id.toString() &&
    review.taskerId._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to access this review');
  }
  
  res.json(review);
});

// @desc    Get review statistics for a tasker
// @route   GET /api/reviews/stats/:taskerId
// @access  Public
const getTaskerReviewStats = asyncHandler(async (req, res) => {
  const { taskerId } = req.params;
  
  // Validate taskerId
  if (!mongoose.Types.ObjectId.isValid(taskerId)) {
    res.status(400);
    throw new Error('Invalid tasker ID');
  }
  
  // Check if tasker exists
  const tasker = await User.findById(taskerId);
  if (!tasker || tasker.role !== 'tasker') {
    res.status(404);
    throw new Error('Tasker not found');
  }
  
  const stats = await calculateTaskerStats(taskerId);
  
  res.json(stats);
});

// @desc    Get review statistics for the logged-in tasker
// @route   GET /api/reviews/my-stats
// @access  Private (tasker only)
const getMyReviewStats = asyncHandler(async (req, res) => {
  // Check if the user is a tasker
  if (req.user.role !== 'tasker') {
    res.status(403);
    throw new Error('Not authorized - only taskers can view their stats');
  }
  
  const stats = await calculateTaskerStats(req.user._id);
  
  res.json(stats);
});

// Helper function to update tasker's average rating in User model
const updateTaskerRatingStats = async (taskerId) => {
  const stats = await calculateTaskerStats(taskerId);
  
  await User.findByIdAndUpdate(taskerId, {
    avgRating: stats.averageRating,
    totalReviews: stats.totalReviews
  });
};

// Helper function to calculate tasker statistics
const calculateTaskerStats = async (taskerId) => {
  const reviews = await Review.find({ taskerId });
  
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Calculate rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating]++;
  });
  
  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution
  };
};

module.exports = {
  createReview,
  getTaskerReviews,
  getMyReviews,
  getMyReceivedReviews,
  checkReview,
  getReviewById,
  getTaskerReviewStats,
  getMyReviewStats
};