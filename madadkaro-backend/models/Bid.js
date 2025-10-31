const mongoose = require('mongoose');

const bidSchema = mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
    tasker: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: [true, 'Please add a bid amount'],
      min: 0,
    },
    message: {
      type: String,
      required: [true, 'Please add a message with your bid'],
    },
    estimatedDuration: {
      type: Number, // in hours
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bid', bidSchema); 