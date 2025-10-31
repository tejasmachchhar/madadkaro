const mongoose = require('mongoose');

const taskReviewSchema = mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false, // Made optional
    },
    type: {
      type: String,
      enum: ['customerToTasker', 'taskerToCustomer'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TaskReview', taskReviewSchema);