const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { task: taskId, receiver: receiverId, content } = req.body;

  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error('Receiver not found');
  }

  // Validate that sender and receiver are part of the task
  const isCustomer = task.customer.toString() === req.user._id.toString();
  const isTasker = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  const receiverIsCustomer = task.customer.toString() === receiverId;
  const receiverIsTasker = task.assignedTo && task.assignedTo.toString() === receiverId;

  if ((!isCustomer && !isTasker) || (!receiverIsCustomer && !receiverIsTasker)) {
    res.status(401);
    throw new Error('You can only send messages to users involved in this task');
  }

  // Handle file attachments if any
  const attachments = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      attachments.push(file.path);
    });
  }

  // Create message
  const message = new Message({
    task: taskId,
    sender: req.user._id,
    receiver: receiverId,
    content,
    attachments
  });

  const createdMessage = await message.save();

  // Populate sender and receiver info
  const populatedMessage = await Message.findById(createdMessage._id)
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture');

  // Access the io instance and userSockets map
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  
  // Get receiver's socket if they're online
  const receiverSocketId = userSockets.get(receiverId);
  
  if (io && receiverSocketId) {
    // Emit message to the receiver
    io.to(receiverSocketId).emit('new_message', populatedMessage);
  }

  res.status(201).json(populatedMessage);
});

// @desc    Get task conversation
// @route   GET /api/messages/task/:taskId
// @access  Private
const getTaskMessages = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  
  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Validate that the user is part of the task
  const isCustomer = task.customer.toString() === req.user._id.toString();
  const isTasker = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isTasker && !isAdmin) {
    res.status(401);
    throw new Error('You can only view messages for tasks you are involved in');
  }

  // Get messages
  const messages = await Message.find({ task: taskId })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture')
    .sort('createdAt');

  // Mark messages as read if user is the receiver
  await Message.updateMany(
    { task: taskId, receiver: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json(messages);
});

// @desc    Get conversation with specific user for a task
// @route   GET /api/messages/task/:taskId/user/:userId
// @access  Private
const getConversationWithUser = asyncHandler(async (req, res) => {
  const { taskId, userId } = req.params;
  
  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Validate that both users are part of the task
  const isCustomer = task.customer.toString() === req.user._id.toString();
  const isTasker = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  const otherUserIsCustomer = task.customer.toString() === userId;
  const otherUserIsTasker = task.assignedTo && task.assignedTo.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if ((!isCustomer && !isTasker && !isAdmin) || (!otherUserIsCustomer && !otherUserIsTasker)) {
    res.status(401);
    throw new Error('You can only view conversations for tasks you are involved in');
  }

  // Get messages between the two users
  const messages = await Message.find({
    task: taskId,
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture')
    .sort('createdAt');

  // Mark messages as read if user is the receiver
  await Message.updateMany(
    { 
      task: taskId,
      sender: userId,
      receiver: req.user._id,
      isRead: false 
    },
    { isRead: true }
  );

  res.json(messages);
});

// @desc    Get unread message count
// @route   GET /api/messages/unread
// @access  Private
const getUnreadMessageCount = asyncHandler(async (req, res) => {
  const unreadCount = await Message.countDocuments({
    receiver: req.user._id,
    isRead: false,
  });

  res.json({ unreadCount });
});

module.exports = {
  sendMessage,
  getTaskMessages,
  getConversationWithUser,
  getUnreadMessageCount,
}; 