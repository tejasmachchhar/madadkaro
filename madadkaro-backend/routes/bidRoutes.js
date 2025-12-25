const express = require('express');
const router = express.Router();
const {
  createBid,
  getTaskBids,
  getUserBids,
  updateBid,
  deleteBid,
  acceptBid,
  getBidById,
  cancelBid,
  rejectBid,
} = require('../controllers/bidController');
const { protect, tasker, customer } = require('../middleware/authMiddleware');

// Protected Routes
router.route('/')
  .post(protect, tasker, createBid);

router.get('/myBids', protect, tasker, getUserBids);
router.get('/task/:taskId', protect, getTaskBids);

router.route('/:id')
  .get(protect, getBidById)
  .put(protect, tasker, updateBid)
  .delete(protect, tasker, deleteBid);

router.put('/:id/accept', protect, customer, acceptBid);
router.put('/:id/reject', protect, customer, rejectBid);
router.put('/:id/cancel', protect, tasker, cancelBid);

module.exports = router;