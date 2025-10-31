const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getTaskMessages,
  getConversationWithUser,
  getUnreadMessageCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protected Routes
router.route('/')
  .post(protect, upload.array('attachments', 3), sendMessage);

router.get('/task/:taskId', protect, getTaskMessages);
router.get('/task/:taskId/user/:userId', protect, getConversationWithUser);
router.get('/unread', protect, getUnreadMessageCount);

module.exports = router; 