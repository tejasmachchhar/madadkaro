const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a task description'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a category'],
      ref: 'Category',
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    budget: {
      type: Number,
      required: [true, 'Please add a budget'],
      min: 0,
    },
    address: { // Changed from location
      type: String,
      required: [true, 'Please add an address'],
    },
    dateRequired: {
      type: Date,
      required: [true, 'Please add a date'],
    },
    timeRequired: {
      type: String,
      required: [true, 'Please add a time'],
    },
    duration: {
      type: Number, // in hours
      required: [true, 'Please add task duration'],
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['open', 'assigned', 'inProgress', 'completionRequested', 'completed', 'cancelled'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    completionRequestedAt: {
      type: Date,
    },
    completionRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completionNote: {
      type: String,
    },
    customerFeedback: {
      type: String,
    },
    taskerFeedback: {
      type: String,
    },
    // Monetization fields
    platformFee: {
      type: Number, // Fee charged to the customer
      default: 0,
    },
    commissionRate: {
      type: Number, // Percentage (e.g., 0.15 for 15%)
      default: 0,
    },
    commissionAmount: {
      type: Number, // Calculated commission amount taken from tasker
      default: 0,
    },
    trustAndSupportFee: {
      type: Number, // Fee for trust, support, insurance
      default: 0,
    },
    finalTaskerPayout: {
      type: Number, // Amount tasker receives (budget - commissionAmount)
      default: 0,
    },
    totalAmountPaidByCustomer: {
      type: Number, // Total amount customer pays (budget + platformFee + trustAndSupportFee)
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: false
      }
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ location: '2dsphere' }, { sparse: true });

// Script to fix existing index (run this once in MongoDB shell if needed):
// db.tasks.dropIndex({ location: '2dsphere' })
// Then restart the server to recreate the sparse index

module.exports = mongoose.model('Task', taskSchema);