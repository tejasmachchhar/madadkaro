const mongoose = require('mongoose');

const platformFeeSchema = mongoose.Schema(
  {
    platformFeePercentage: {
      type: Number,
      required: [true, 'Please add platform fee percentage'],
      min: 0,
      max: 100,
      default: 5, // 5%
    },
    trustAndSupportFee: {
      type: Number,
      required: [true, 'Please add trust and support fee'],
      min: 0,
      default: 2, // Fixed amount
    },
    commissionPercentage: {
      type: Number,
      required: [true, 'Please add commission percentage'],
      min: 0,
      max: 100,
      default: 15, // 15%
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const PlatformFee = mongoose.model('PlatformFee', platformFeeSchema);

module.exports = PlatformFee;