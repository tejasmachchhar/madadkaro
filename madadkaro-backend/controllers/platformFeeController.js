const asyncHandler = require('express-async-handler');
const PlatformFee = require('../models/PlatformFee');

// @desc    Get current platform fees
// @route   GET /api/admin/platform-fees
// @access  Private/Admin
const getPlatformFees = asyncHandler(async (req, res) => {
  const fees = await PlatformFee.findOne().sort({ createdAt: -1 });
  
  if (!fees) {
    // Create default fees if none exist
    const defaultFees = await PlatformFee.create({
      platformFeePercentage: 5,
      trustAndSupportFee: 2,
      commissionPercentage: 15,
      lastUpdatedBy: req.user._id,
    });
    res.json(defaultFees);
  } else {
    res.json(fees);
  }
});

// @desc    Update platform fees
// @route   PUT /api/admin/platform-fees
// @access  Private/Admin
const updatePlatformFees = asyncHandler(async (req, res) => {
  const { platformFeePercentage, trustAndSupportFee, commissionPercentage } = req.body;

  // Validate input
  if (platformFeePercentage < 0 || platformFeePercentage > 100) {
    res.status(400);
    throw new Error('Platform fee percentage must be between 0 and 100');
  }

  if (trustAndSupportFee < 0) {
    res.status(400);
    throw new Error('Trust and support fee must be greater than or equal to 0');
  }

  if (commissionPercentage < 0 || commissionPercentage > 100) {
    res.status(400);
    throw new Error('Commission percentage must be between 0 and 100');
  }

  const newFees = await PlatformFee.create({
    platformFeePercentage,
    trustAndSupportFee,
    commissionPercentage,
    lastUpdatedBy: req.user._id,
  });

  res.json(newFees);
});

module.exports = {
  getPlatformFees,
  updatePlatformFees,
};