const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Bid = require('../models/Bid');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getBidPopulateFields } = require('../utils/bidUtils');

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private/Customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Created task object
 */
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private/Customer
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    budget,
    address, // Changed from location
    dateRequired,
    timeRequired,
    duration,
    isUrgent,
  } = req.body;

  // Validate that category and subcategory exist and are related
  if (subcategory) {
    const subcategoryDoc = await Category.findById(subcategory);
    if (!subcategoryDoc) {
      res.status(400);
      throw new Error('Subcategory not found');
    }
    
    // Ensure the subcategory belongs to the selected category
    if (subcategoryDoc.parentCategory && subcategoryDoc.parentCategory.toString() !== category) {
      res.status(400);
      throw new Error('Subcategory does not belong to the selected category');
    }
  }

  const task = new Task({
    customer: req.user._id,
    title,
    description,
    category,
    subcategory,
    budget,
    address, // Changed from location
    dateRequired,
    timeRequired,
    duration,
    isUrgent: isUrgent || false,
  });

  if (req.body.latitude && req.body.longitude) {
    task.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
    };
  }

  // If there are images, add them
  if (req.files && req.files.length > 0) {
    const images = req.files.map((file) => file.path);
    task.images = images;
  }

  // Get current platform fees
  const PlatformFee = require('../models/PlatformFee');
  const currentFees = await PlatformFee.findOne().sort({ createdAt: -1 });

  // Use default fees if no configuration exists
  const platformFeePercentage = (currentFees?.platformFeePercentage || 5) / 100;
  const commissionPercentage = (currentFees?.commissionPercentage || 15) / 100;
  const trustAndSupportFee = currentFees?.trustAndSupportFee || 2;

  task.platformFee = task.budget * platformFeePercentage;
  task.commissionRate = commissionPercentage;
  task.commissionAmount = task.budget * commissionPercentage;
  task.trustAndSupportFee = trustAndSupportFee;
  task.finalTaskerPayout = task.budget - task.commissionAmount;
  task.totalAmountPaidByCustomer = task.budget + task.platformFee + task.trustAndSupportFee;

  const createdTask = await task.save();
  res.status(201).json(createdTask);
});

/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Tasks with pagination
 */
// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
const getTasks = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  
  const keyword = req.query.keyword
    ? {
        title: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  let categoryFilter = {};
  if (req.query.category) {
    categoryFilter.category = req.query.category;
  }
  if (req.query.subcategory) {
    categoryFilter.subcategory = req.query.subcategory;
  }
  const status = req.query.status ? { status: req.query.status } : {};

  // Urgent filter
  const urgentFilter = req.query.isUrgent !== undefined ? { isUrgent: req.query.isUrgent === 'true' } : {};

  let query = { ...keyword, ...categoryFilter, ...status, ...urgentFilter };

  // Budget filter
  let budgetFilter = {};
  if (req.query.minBudget) budgetFilter.$gte = Number(req.query.minBudget);
  if (req.query.maxBudget) budgetFilter.$lte = Number(req.query.maxBudget);
  if (Object.keys(budgetFilter).length) query.budget = budgetFilter;

  // Location string filter
  if (req.query.location) {
    query.address = { $regex: req.query.location, $options: 'i' };
  }

  // Geospatial filter
  if (req.query.latitude && req.query.longitude && req.query.distance) {
    const lng = parseFloat(req.query.longitude);
    const lat = parseFloat(req.query.latitude);
    const dist = parseFloat(req.query.distance) / 6378.1;
    query.location = {
      $geoWithin: {
        $centerSphere: [[lng, lat], dist]
      }
    };
  }

  const count = await Task.countDocuments(query);
  let tasks = await Task.find(query)
    .populate('customer', 'name email profilePicture')
    .populate('assignedTo', 'name email profilePicture')
    .populate('category', 'name slug icon')
    .populate('subcategory', 'name slug icon')
    .sort({ isUrgent: -1, createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  // If a user is logged in and is a tasker, check if they have bid on each task
  if (req.user && req.user.role === 'tasker') {
    const taskIds = tasks.map(task => task._id);
    const userBids = await Bid.find({ tasker: req.user._id, task: { $in: taskIds } });

    const userBidMap = new Map(userBids.map(bid => [bid.task.toString(), bid.toObject()]));
    tasks = tasks.map(task => ({
      ...task.toObject(),
      hasUserBid: userBidMap.has(task._id.toString()),
      userBid: userBidMap.get(task._id.toString()) || null
    }));
  }

  res.json({ tasks, page, pages: Math.ceil(count / pageSize), count });
});

/**
 * @desc    Get task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Task details with bids if authorized
 */
// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('customer', 'name email profilePicture')
    .populate('assignedTo', 'name email profilePicture')
    .populate('category', 'name slug icon')
    .populate('subcategory', 'name slug icon');
    // .select('+platformFee +commissionRate +commissionAmount +trustAndSupportFee +finalTaskerPayout +totalAmountPaidByCustomer'); // Ensure these fields are selected

  if (task) {
    // Allow viewing bids if task is open or if user is owner/admin
    const isTaskOwner = req.user && task.customer && 
      task.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    const isOpenTask = task.status === 'open';
        
    const taskWithBids = task.toObject();

    if (isOpenTask || isTaskOwner || isAdmin) {
      // Populate limited fields for privacy if not owner/admin
      const populateFields = getBidPopulateFields(isTaskOwner || isAdmin);
      const bids = await Bid.find({ task: task._id })
        .populate('tasker', populateFields)
        .sort({ createdAt: -1 });
      taskWithBids.bids = bids;
    }

    // If a tasker is logged in, check if they have bid on this task
    if (req.user && req.user.role === 'tasker') {
      const userBid = await Bid.findOne({ task: task._id, tasker: req.user._id });
      if (userBid) {
        taskWithBids.hasUserBid = true;
        taskWithBids.userBid = userBid.toObject();
      } else {
        taskWithBids.hasUserBid = false;
        taskWithBids.userBid = null;
      }
    }
    
    res.json(taskWithBids);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private/Customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Updated task object
 */
// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private/Customer
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (task) {
    // Check if the user is the customer who created the task
    if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to update this task');
    }

    // Only allow updates if task is in 'open' status
    if (task.status !== 'open' && req.user.role !== 'admin') {
      res.status(400);
      throw new Error('Task cannot be updated once it has been assigned or is in progress');
    }

    // Validate that category and subcategory exist and are related
    if (req.body.subcategory && req.body.category) {
      const subcategoryDoc = await Category.findById(req.body.subcategory);
      if (!subcategoryDoc) {
        res.status(400);
        throw new Error('Subcategory not found');
      }
      
      // Ensure the subcategory belongs to the selected category
      if (subcategoryDoc.parentCategory && subcategoryDoc.parentCategory.toString() !== req.body.category) {
        res.status(400);
        throw new Error('Subcategory does not belong to the selected category');
      }
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.category = req.body.category || task.category;
    task.subcategory = req.body.subcategory || task.subcategory;
    task.budget = req.body.budget || task.budget;
    task.address = req.body.address || task.address; // Changed from location
    task.dateRequired = req.body.dateRequired || task.dateRequired;
    task.timeRequired = req.body.timeRequired || task.timeRequired;
    task.duration = req.body.duration || task.duration;
    task.isUrgent = req.body.isUrgent !== undefined ? req.body.isUrgent : task.isUrgent;

    // If budget is updated, recalculate fees
    if (req.body.budget && req.body.budget !== task.budget) {
      const platformFeePercentage = 0.05; // 5% platform fee
      const commissionPercentage = 0.15; // 15% commission
      const fixedTrustAndSupportFee = 2; // Example: $2 or 2 units of currency

      task.platformFee = task.budget * platformFeePercentage;
      task.commissionRate = commissionPercentage;
      task.commissionAmount = task.budget * commissionPercentage;
      task.trustAndSupportFee = fixedTrustAndSupportFee;
      task.finalTaskerPayout = task.budget - task.commissionAmount;
      task.totalAmountPaidByCustomer = task.budget + task.platformFee + task.trustAndSupportFee;
    }

    // Handle images
    if (req.body.existingImages) {
      // Parse existingImages if it's a string (from form data)
      let existingImages = req.body.existingImages;
      if (typeof existingImages === 'string') {
        try {
          existingImages = JSON.parse(existingImages);
        } catch (e) {
          existingImages = [existingImages];
        }
      }
      task.images = Array.isArray(existingImages) ? existingImages : [existingImages];
    } else {
      // If no existingImages provided, keep current images
      task.images = task.images || [];
    }
    
    // Append new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      task.images = [...task.images, ...newImages];
    }
    console.log('task saving');
    console.log('Task data before save:', {
      title: task.title,
      description: task.description,
      category: task.category,
      budget: task.budget,
      address: task.address, // Changed from location
      dateRequired: task.dateRequired,
      timeRequired: task.timeRequired,
      duration: task.duration,
      images: task.images,
      status: task.status,
      isUrgent: task.isUrgent
    });
    try {
      const updatedTask = await task.save();
      console.log('task updated successfully');
      res.json(updatedTask);
    } catch (error) {
      console.error('Error saving task:', error);
      res.status(500);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Customer
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (task) {
    // Check if the user is the customer who created the task
    if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this task');
    }

    // Only allow deletion if task is in 'open' status
    if (task.status !== 'open' && req.user.role !== 'admin') {
      res.status(400);
      throw new Error('Task cannot be deleted once it has been assigned or is in progress');
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Assign task to tasker
// @route   PUT /api/tasks/:id/assign
// @access  Private/Customer
const assignTask = asyncHandler(async (req, res) => {
  const { taskerId, bidId } = req.body;
  const task = await Task.findById(req.params.id);

  if (task) {
    // Check if the user is the customer who created the task
    if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to assign this task');
    }

    // Only allow assignment if task is in 'open' status
    if (task.status !== 'open') {
      res.status(400);
      throw new Error('Task has already been assigned or is in progress');
    }

    task.assignedTo = taskerId;
    task.status = 'assigned';

    const updatedTask = await task.save();
    res.json(updatedTask);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.id)
    .populate('customer', 'name')
    .populate('assignedTo', 'name');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if this is a direct start task request from the route
  const isStartTaskRequest = req.path.endsWith('/start');
  let newStatus = status;

  if (isStartTaskRequest) {
    // If it's a start task request, set status to inProgress
    newStatus = 'inProgress';
    
    // Only the assigned tasker can start a task
    const isAssignedTasker = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();
    if (!isAssignedTasker && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Only the assigned tasker can start this task');
    }
    
    // Task must be in 'assigned' status to start
    if (task.status !== 'assigned') {
      res.status(400);
      throw new Error('Task must be in assigned status to start');
    }
  } else {
    // Regular status update request
    // Check if the user is the customer or the assigned tasker
    const isCustomer = task.customer._id.toString() === req.user._id.toString();
    const isAssignedTasker = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAssignedTasker && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized to update this task status');
    }

    // Log task status transition attempt
    console.log(`Task status transition attempt - TaskID: ${task._id}, Current status: ${task.status}, New status: ${newStatus}`);
    
    // Validate status transition
    if ((newStatus === 'inProgress' && task.status !== 'assigned') ||
        (newStatus === 'completed' && task.status !== 'inProgress') ||
        (newStatus === 'cancelled' && task.status === 'completed')) {
      console.error(`Invalid status transition - TaskID: ${task._id}, Current status: ${task.status}, New status: ${newStatus}`);
      res.status(400);
      throw new Error('Invalid status transition');
    }
  }

  // Update the task status
  task.status = newStatus;

  // If completing the task, set completedAt
  if (newStatus === 'completed') {
    task.completedAt = new Date();
  }
  
  // If starting the task, set startedAt
  if (newStatus === 'inProgress' && task.status !== 'inProgress') {
    task.startedAt = new Date();
    
    // Create notification for the customer
    const notification = new Notification({
      recipient: task.customer._id,
      sender: req.user._id,
      type: 'task_started',
      title: 'Task Started',
      message: `${req.user.name} has started working on task "${task.title}".`,
      task: task._id,
      data: {
        taskerId: req.user._id,
        taskerName: req.user.name,
        taskTitle: task.title,
        taskId: task._id
      },
    });
    
    await notification.save();
    
    // Send real-time notification if socket is available
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets && userSockets[task.customer._id]) {
      userSockets[task.customer._id].forEach(socketId => {
        io.to(socketId).emit('notification', {
          type: 'task_started',
          message: `${req.user.name} has started working on task "${task.title}".`,
          data: {
            taskId: task._id,
            taskTitle: task.title,
            taskerName: req.user.name,
          },
        });
      });
    }
  }

  try {
    const updatedTask = await task.save();
    console.log(`Task status updated successfully - TaskID: ${task._id}, New status: ${task.status}`);
    res.json(updatedTask);
  } catch (error) {
    console.error(`Error saving task status update: ${error.message}`, error);
    res.status(500);
    throw new Error(`Failed to update task status: ${error.message}`);
  }
});

// @desc    Get tasks for current user (customer's posted tasks or tasker's assigned tasks)
// @route   GET /api/tasks/user/myTasks
// @access  Private
const getUserTasks = asyncHandler(async (req, res) => {
  let tasks;
  let query = {};
  
  // Handle status filter
  if (req.query.status) {
    const statusArray = req.query.status.split(',');
    query.status = { $in: statusArray };
  }

  if (req.user.role === 'customer') {
    // Get tasks created by this customer
    query.customer = req.user._id;
    tasks = await Task.find(query)
      .populate('assignedTo', 'name email profilePicture')
      .sort({ createdAt: -1 });
  } else if (req.user.role === 'tasker') {
    // Get tasks assigned to this tasker
    query.assignedTo = req.user._id;
    tasks = await Task.find(query)
      .populate('customer', 'name email profilePicture')
      .sort({ createdAt: -1 });
  } else if (req.user.role === 'admin') {
    // Admins can see all tasks
    tasks = await Task.find(query)
      .populate('customer', 'name email profilePicture')
      .populate('assignedTo', 'name email profilePicture')
      .sort({ createdAt: -1 });
  }

  res.json(tasks);
});

// @desc    Get distinct addresses from tasks (previously locations)
// @route   GET /api/tasks/addresses
// @access  Public
const getTaskAddresses = asyncHandler(async (req, res) => {
  const addresses = await Task.distinct('address');
  res.json(addresses);
});

// @desc    Get distinct categories from tasks
// @route   GET /api/tasks/categories
// @access  Public
const getTaskCategories = asyncHandler(async (req, res) => {
  const categories = await Task.distinct('category');
  res.json(categories);
});

// @desc    Request task completion
// @route   PUT /api/tasks/:id/request-completion
// @access  Private/Tasker
const requestTaskCompletion = asyncHandler(async (req, res) => {
  const { completionNote } = req.body;
  const task = await Task.findById(req.params.id).populate('customer', 'name');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if the user is the assigned tasker
  if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to request completion for this task');
  }

  // Only allow completion request if task is in 'inProgress' status
  if (task.status !== 'inProgress') {
    res.status(400);
    throw new Error('Task must be in progress to request completion');
  }

  // Update task status to 'completionRequested'
  task.status = 'completionRequested';
  task.completionRequestedAt = new Date();
  task.completionRequestedBy = req.user._id;
  task.completionNote = completionNote || '';

  const updatedTask = await task.save();

  // Create notification for the customer
  const notification = new Notification({
    recipient: task.customer._id,
    sender: req.user._id,
    type: 'completion_requested',
    title: 'Task Completion Requested',
    message: `${req.user.name} has requested to mark task "${task.title}" as completed.`,
    task: task._id,
    data: {
      taskerId: req.user._id,
      taskerName: req.user.name,
      taskTitle: task.title,
      completionNote: completionNote || '',
    },
  });

  await notification.save();

  // Send real-time notification if socket is available
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  
  if (io && userSockets && userSockets[task.customer._id]) {
    userSockets[task.customer._id].forEach(socketId => {
      io.to(socketId).emit('notification', {
        type: 'completion_requested',
        message: `${req.user.name} has requested to mark task "${task.title}" as completed.`,
        data: {
          taskId: task._id,
          taskTitle: task.title,
          taskerName: req.user.name,
        },
      });
    });
  }

  res.json(updatedTask);
});

// @desc    Confirm task completion
// @route   PUT /api/tasks/:id/confirm-completion
// @access  Private/Customer
const confirmTaskCompletion = asyncHandler(async (req, res) => {
  const { customerFeedback } = req.body;
  const task = await Task.findById(req.params.id).populate('assignedTo', 'name');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if the user is the customer
  if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to confirm completion for this task');
  }

  // Only allow completion confirmation if task is in 'completionRequested' status
  if (task.status !== 'completionRequested') {
    res.status(400);
    throw new Error('Task must have a pending completion request');
  }

  // Update task status to 'completed'
  task.status = 'completed';
  task.completedAt = new Date();
  task.customerFeedback = customerFeedback || '';

  const updatedTask = await task.save();

  // Increment completedTasks counter for the tasker
  await User.findByIdAndUpdate(
    task.assignedTo._id,
    { $inc: { completedTasks: 1 } }
  );

  // Create notification for the tasker
  const notification = new Notification({
    recipient: task.assignedTo._id,
    sender: req.user._id,
    type: 'completion_confirmed',
    title: 'Task Completion Confirmed',
    message: `${req.user.name} has confirmed completion of task "${task.title}".`,
    task: task._id,
    data: {
      customerId: req.user._id,
      customerName: req.user.name,
      taskTitle: task.title,
      customerFeedback: customerFeedback || '',
    },
  });

  await notification.save();

  // Send real-time notification if socket is available
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  
  if (io && userSockets && userSockets.get(task.assignedTo._id.toString())) {
    const socketId = userSockets.get(task.assignedTo._id.toString());
    io.to(socketId).emit('notification', {
      type: 'completion_confirmed',
      message: `${req.user.name} has confirmed completion of task "${task.title}".`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        customerName: req.user.name,
      },
    });
  }

  res.json(updatedTask);
});

// @desc    Reject task completion request
// @route   PUT /api/tasks/:id/reject-completion
// @access  Private/Customer
const rejectTaskCompletion = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const task = await Task.findById(req.params.id).populate('assignedTo', 'name');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if the user is the customer
  if (task.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to reject completion for this task');
  }

  // Only allow completion rejection if task is in 'completionRequested' status
  if (task.status !== 'completionRequested') {
    res.status(400);
    throw new Error('Task must have a pending completion request');
  }

  // Update task status back to 'inProgress'
  task.status = 'inProgress';
  task.completionRequestedAt = null;
  task.completionRequestedBy = null;
  task.completionNote = '';

  const updatedTask = await task.save();

  // Create notification for the tasker
  const notification = new Notification({
    recipient: task.assignedTo._id,
    sender: req.user._id,
    type: 'completion_rejected',
    title: 'Task Completion Rejected',
    message: `${req.user.name} has rejected the completion request for task "${task.title}".`,
    task: task._id,
    data: {
      customerId: req.user._id,
      customerName: req.user.name,
      taskTitle: task.title,
      rejectionReason: rejectionReason || '',
    },
  });

  await notification.save();

  // Send real-time notification if socket is available
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  
  if (io && userSockets && userSockets.get(task.assignedTo._id.toString())) {
    const socketId = userSockets.get(task.assignedTo._id.toString());
    io.to(socketId).emit('notification', {
      type: 'completion_rejected',
      message: `${req.user.name} has rejected the completion request for task "${task.title}".`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        customerName: req.user.name,
        rejectionReason: rejectionReason || '',
      },
    });
  }

  res.json(updatedTask);
});

// @desc    Add tasker feedback
// @route   PUT /api/tasks/:id/tasker-feedback
// @access  Private/Tasker
const addTaskerFeedback = asyncHandler(async (req, res) => {
  const { taskerFeedback } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if the user is the assigned tasker
  if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to add feedback for this task');
  }

  // Only allow feedback if task is completed
  if (task.status !== 'completed') {
    res.status(400);
    throw new Error('Feedback can only be added to completed tasks');
  }

  // Update tasker feedback
  task.taskerFeedback = taskerFeedback;
  const updatedTask = await task.save();

  res.json(updatedTask);
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  getUserTasks,
  getTaskAddresses,
  getTaskCategories,
  requestTaskCompletion,
  confirmTaskCompletion,
  rejectTaskCompletion,
  addTaskerFeedback,
};