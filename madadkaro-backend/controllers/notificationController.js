const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../services/pushNotificationService');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private
const createNotification = asyncHandler(async (req, res) => {
  const { recipient, sender, type, title, message, task, bid, data } = req.body;

  // Check if recipient exists
  const recipientExists = await User.findById(recipient);
  if (!recipientExists) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  // Create notification
  const notification = new Notification({
    recipient,
    sender: sender || req.user._id,
    type,
    title,
    message,
    task,
    bid,
    data,
  });

  const createdNotification = await notification.save();
  
  // Send push notification
  await sendPushNotification(recipient, createdNotification);
  
  res.status(201).json(createdNotification);
});

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.pageNumber) || 1;
  
  const count = await Notification.countDocuments({ recipient: req.user._id });
  
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'name profilePicture')
    .populate('task', 'title')
    .populate('bid', 'amount status')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  
  res.json({ 
    notifications, 
    page, 
    pages: Math.ceil(count / pageSize),
    unreadCount: await Notification.countDocuments({ 
      recipient: req.user._id,
      isRead: false
    })
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (notification) {
    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to update this notification');
    }
    
    notification.isRead = true;
    const updatedNotification = await notification.save();
    
    res.json(updatedNotification);
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  
  res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (notification) {
    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this notification');
    }
    
    await notification.deleteOne();
    res.json({ message: 'Notification removed' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  
  res.json({ unreadCount: count });
});

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
}; 