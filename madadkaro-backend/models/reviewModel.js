const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    taskerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: false
    },
    taskTitle: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Prevent multiple reviews on the same task
reviewSchema.index({ taskId: 1, reviewer: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;