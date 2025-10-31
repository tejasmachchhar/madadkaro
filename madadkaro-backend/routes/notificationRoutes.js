const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected Routes
router.route('/')
  .get(protect, getUserNotifications)
  .post(protect, admin, createNotification);

router.route('/:id')
  .delete(protect, deleteNotification);

router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.get('/unread-count', protect, getUnreadCount);

module.exports = router; 