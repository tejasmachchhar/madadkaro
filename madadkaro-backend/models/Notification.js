const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'bid',
        'new_bid',
        'bid_accepted',
        'bid_rejected',
        'task_assigned',
        'task_started',
        'task_cancelled',
        'completion_requested',
        'completion_confirmed',
        'completion_rejected',
        'review_received',
        'message',
        'task_update',
        'system'
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    bid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema); 