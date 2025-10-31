const express = require('express');
const router = express.Router();
const {
  getPlatformFees,
  updatePlatformFees,
} = require('../controllers/platformFeeController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected with admin middleware
router.use(protect, admin);

router
  .route('/')
  .get(getPlatformFees)
  .put(updatePlatformFees);

module.exports = router;