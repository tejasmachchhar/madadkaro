const asyncHandler = require('express-async-handler');
const Bid = require('../models/Bid');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { getBidPopulateFields } = require('../utils/bidUtils');

/**
 * @desc    Create a new bid
 * @route   POST /api/bids
 * @access  Private/Tasker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Created bid object
 */
// @desc    Create a new bid
// @route   POST /api/bids
// @access  Private/Tasker
const createBid = asyncHandler(async (req, res) => {
  const { task: taskId, amount, message, estimatedDuration } = req.body;

  // Check if task exists
  const task = await Task.findById(taskId).populate('customer', 'name');
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task is open for bidding
  if (task.status !== 'open') {
    res.status(400);
    throw new Error('This task is no longer accepting bids');
  }

  // Check if user is a tasker
  if (req.user.role !== 'tasker' && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Only taskers can place bids');
  }

  // Check if user has already bid on this task
  const existingBid = await Bid.findOne({
    task: taskId,
    tasker: req.user._id,
  });

  if (existingBid) {
    res.status(400);
    throw new Error('You have already placed a bid on this task');
  }

  // Create new bid
  const bid = new Bid({
    task: taskId,
    tasker: req.user._id,
    amount,
    message,
    estimatedDuration,
  });

  const createdBid = await bid.save();

  // Create notification for the task owner
  const notification = new Notification({
    recipient: task.customer._id,
    sender: req.user._id,
    type: 'bid',
    title: 'New Bid Received',
    message: `${req.user.name} has placed a bid of ₹${amount} on your task "${task.title}"`,
    task: taskId,
    bid: createdBid._id,
    data: {
      amount,
      taskerName: req.user.name,
      taskTitle: task.title,
    },
  });

  await notification.save();

  // Send real-time notification if socket is available
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  
  if (io && userSockets) {
    const customerSocketId = userSockets.get(task.customer._id.toString());
    
    if (customerSocketId) {
      io.to(customerSocketId).emit('notification', {
        type: 'new_bid',
        message: `${req.user.name} has placed a bid of ₹${amount} on your task "${task.title}"`,
        data: {
          taskId,
          bidId: createdBid._id,
          amount,
          taskerName: req.user.name,
          taskTitle: task.title,
        },
      });
    }
  }

  res.status(201).json(createdBid);
});

/**
 * @desc    Get all bids for a task
 * @route   GET /api/bids/task/:taskId
 * @access  Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} List of bids for the task
 */
// @desc    Get all bids for a task
// @route   GET /api/bids/task/:taskId
// @access  Private
const getTaskBids = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  
  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Allow any authenticated user to view bids if task is open, otherwise only customer or admin
  const isCustomer = task.customer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isOpenTask = task.status === 'open';

  if (!isOpenTask && !isCustomer && !isAdmin) {
    res.status(401);
    throw new Error('Not authorized to view bids for this task');
  }

  // Populate limited fields for privacy
  const populateFields = getBidPopulateFields(isCustomer || isAdmin);

  const bids = await Bid.find({ task: taskId })
    .populate('tasker', populateFields)
    .sort({ amount: 1 });
  
  res.json(bids);
});

/**
 * @desc    Get bids by current tasker
 * @route   GET /api/bids/myBids
 * @access  Private/Tasker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} List of user's bids
 */
// @desc    Get bids by current tasker
// @route   GET /api/bids/myBids
// @access  Private/Tasker
const getUserBids = asyncHandler(async (req, res) => {
  if (req.user.role !== 'tasker' && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Only taskers can view their bids');
  }

  // Handle status filter from query params
  let statusFilter = {};
  if (req.query.status) {
    const statusValues = req.query.status.split(',');
    statusFilter = { status: { $in: statusValues } };
  }

  // Handle task status filter
  let taskStatusFilter = {};
  if (req.query.taskStatus) {
    if (req.query.taskStatus.startsWith('!')) {
      // Exclude tasks with this status
      taskStatusFilter = { 'task.status': { $ne: req.query.taskStatus.substring(1) } };
    } else {
      // Include tasks with this status
      taskStatusFilter = { 'task.status': req.query.taskStatus };
    }
  }

  const bids = await Bid.find({ 
    tasker: req.user._id,
    ...statusFilter
  })
    .populate({
      path: 'task',
      select: 'title description budget status dateRequired assignedTo category location',
      populate: {
        path: 'customer',
        select: 'name profilePicture',
      },
    })
    .sort({ createdAt: -1 });

  // Apply task status filter after population
  const filteredBids = bids.filter(bid => {
    if (!bid.task) return false;
    if (req.query.taskStatus?.startsWith('!')) {
      return bid.task.status !== req.query.taskStatus.substring(1);
    }
    if (req.query.taskStatus) {
      return bid.task.status === req.query.taskStatus;
    }
    return true;
  });

  res.json(filteredBids);
});

/**
 * @desc    Update bid
 * @route   PUT /api/bids/:id
 * @access  Private/Tasker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Updated bid object
 */
// @desc    Update bid
// @route   PUT /api/bids/:id
// @access  Private/Tasker
const updateBid = asyncHandler(async (req, res) => {
  const { amount, message, estimatedDuration } = req.body;
  
  const bid = await Bid.findById(req.params.id);

  if (bid) {
    // Check if user is the tasker who created the bid
    if (bid.tasker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to update this bid');
    }

    // Check if bid can be updated (only if status is pending)
    if (bid.status !== 'pending') {
      res.status(400);
      throw new Error('Bid cannot be updated once it has been accepted or rejected');
    }

    // Update bid fields
    bid.amount = amount || bid.amount;
    bid.message = message || bid.message;
    bid.estimatedDuration = estimatedDuration || bid.estimatedDuration;

    const updatedBid = await bid.save();
    res.json(updatedBid);
  } else {
    res.status(404);
    throw new Error('Bid not found');
  }
});

// @desc    Delete bid
// @route   DELETE /api/bids/:id
// @access  Private/Tasker
const deleteBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);

  if (bid) {
    // Check if user is the tasker who created the bid
    if (bid.tasker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this bid');
    }

    // Check if bid can be deleted (only if status is pending)
    if (bid.status !== 'pending') {
      res.status(400);
      throw new Error('Bid cannot be deleted once it has been accepted or rejected');
    }

    await bid.deleteOne();
    res.json({ message: 'Bid removed' });
  } else {
    res.status(404);
    throw new Error('Bid not found');
  }
});

// @desc    Accept bid
// @route   PUT /api/bids/:id/accept
// @access  Private/Customer
const acceptBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id)
    .populate('task')
    .populate('tasker', 'name email profilePicture avgRating totalReviews');

  if (bid) {
    const task = bid.task;

    // Check if user is the customer who created the task
    if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to accept this bid');
    }

    // Check if task is still open
    if (task.status !== 'open') {
      res.status(400);
      throw new Error('Task has already been assigned');
    }

    // Update bid status
    bid.status = 'accepted';
    await bid.save();

    // Update task status and assignedTo
    task.status = 'assigned';
    task.assignedTo = bid.tasker._id;
    await task.save();

    // Reject all other bids
    await Bid.updateMany(
      { task: task._id, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    // Create notification for the tasker
    const notification = new Notification({
      recipient: bid.tasker._id,
      sender: req.user._id,
      type: 'bid_accepted',
      title: 'Bid Accepted',
      message: `Your bid of ₹${bid.amount} on task "${task.title}" has been accepted!`,
      task: task._id,
      bid: bid._id,
      data: {
        amount: bid.amount,
        customerName: req.user.name,
        taskTitle: task.title,
      },
    });

    await notification.save();

    // Send real-time notification if socket is available
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const taskerSocketId = userSockets.get(bid.tasker._id.toString());
      
      if (taskerSocketId) {
        io.to(taskerSocketId).emit('notification', {
          type: 'bid_accepted',
          message: `Your bid of ₹${bid.amount} on task "${task.title}" has been accepted!`,
          data: {
            taskId: task._id,
            bidId: bid._id,
            amount: bid.amount,
            customerName: req.user.name,
            taskTitle: task.title,
          },
        });
      }
    }

    res.json({ message: 'Bid accepted', bid });
  } else {
    res.status(404);
    throw new Error('Bid not found');
  }
});

// @desc    Reject bid
// @route   PUT /api/bids/:id/reject
// @access  Private/Customer
const rejectBid = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const bid = await Bid.findById(req.params.id)
    .populate('task')
    .populate('tasker', 'name email profilePicture avgRating totalReviews');

  if (bid) {
    const task = bid.task;

    // Check if user is the customer who created the task
    if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to reject this bid');
    }

    // Check if bid is still pending
    if (bid.status !== 'pending') {
      res.status(400);
      throw new Error('This bid is no longer pending');
    }

    // Update bid status and add rejection reason if provided
    bid.status = 'rejected';
    if (reason) {
      bid.rejectionReason = reason;
    }
    
    await bid.save();

    // Create notification for the tasker
    const notification = new Notification({
      recipient: bid.tasker._id,
      sender: req.user._id,
      type: 'bid_rejected',
      title: 'Bid Rejected',
      message: `Your bid of ₹${bid.amount} on task "${task.title}" has been rejected.`,
      task: task._id,
      bid: bid._id,
      data: {
        amount: bid.amount,
        customerName: req.user.name,
        taskTitle: task.title,
        reason: reason || '',
      },
    });

    await notification.save();

    // Send real-time notification if socket is available
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const taskerSocketId = userSockets.get(bid.tasker._id.toString());
      
      if (taskerSocketId) {
        io.to(taskerSocketId).emit('notification', {
          type: 'bid_rejected',
          message: `Your bid of ₹${bid.amount} on task "${task.title}" has been rejected.`,
          data: {
            taskId: task._id,
            bidId: bid._id,
            amount: bid.amount,
            customerName: req.user.name,
            taskTitle: task.title,
            reason: reason || '',
          },
        });
      }
    }

    res.json({ message: 'Bid rejected', bid });
  } else {
    res.status(404);
    throw new Error('Bid not found');
  }
});

// @desc    Get bid by ID
// @route   GET /api/bids/:id
// @access  Private
const getBidById = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id)
    .populate('tasker', 'name email profilePicture avgRating totalReviews')
    .populate({
      path: 'task',
      populate: {
        path: 'customer',
        select: 'name email profilePicture',
      },
    });

  if (bid) {
    // Check if user is authorized to view this bid
    const isTasker = bid.tasker._id.toString() === req.user._id.toString();
    const isCustomer = bid.task.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isTasker && !isCustomer && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized to view this bid');
    }

    res.json(bid);
  } else {
    res.status(404);
    throw new Error('Bid not found');
  }
});

// @desc    Cancel bid
// @route   PUT /api/bids/:id/cancel
// @access  Private/Tasker
const cancelBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);

  if (bid) {
    // Check if user is the tasker who created the bid
    if (bid.tasker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to cancel this bid');
    }

    // Check if bid can be cancelled (only if status is pending)
    if (bid.status !== 'pending') {
      res.status(400);
      throw new Error('Bid cannot be cancelled once it has been accepted or rejected');
    }

    // Update bid status to cancelled
    bid.status = 'cancelled';
    const updatedBid = await bid.save();
    
    res.json({ message: 'Bid cancelled successfully', bid: updatedBid });
  } else {
    res.status(404);
    throw new Error('Bid not found');
  }
});

module.exports = {
  createBid,
  getTaskBids,
  getUserBids,
  updateBid,
  deleteBid,
  acceptBid,
  rejectBid,
  getBidById,
  cancelBid,
};