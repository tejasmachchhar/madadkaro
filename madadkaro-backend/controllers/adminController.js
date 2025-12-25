const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Task = require('../models/Task');
const Bid = require('../models/Bid');
const Category = require('../models/Category');
const Review = require('../models/reviewModel');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const customerCount = await User.countDocuments({ role: 'customer' });
  const taskerCount = await User.countDocuments({ role: 'tasker' });
  
  const totalTasks = await Task.countDocuments();
  const openTasks = await Task.countDocuments({ status: 'open' });
  const inProgressTasks = await Task.countDocuments({ status: 'inProgress' });
  const completedTasks = await Task.countDocuments({ status: 'completed' });
  
  const totalBids = await Bid.countDocuments();
  
  // Calculate total earnings (platform fee from completed tasks)
  const completedTasksData = await Task.find({ status: 'completed' });
  const totalEarnings = completedTasksData.reduce((sum, task) => sum + (task.budget * 0.10), 0); // Assuming 10% platform fee
  
  const categoryCount = await Category.countDocuments();
  const reviewCount = await Review.countDocuments();
  
  // Get user registration trend (last 7 days)
  const today = new Date();
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const userTrend = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: last7Days }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  // Get task creation trend (last 7 days)
  const taskTrend = await Task.aggregate([
    {
      $match: {
        createdAt: { $gte: last7Days }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  res.json({
    totalUsers,
    customerCount,
    taskerCount,
    totalTasks,
    openTasks,
    inProgressTasks,
    completedTasks,
    totalBids,
    totalEarnings,
    categoryCount,
    reviewCount,
    userTrend,
    taskTrend
  });
});

// @desc    Get all users with filtering, sorting, pagination
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { 
    search, 
    role, 
    isActive, 
    sort = '-createdAt',
    page = 1, 
    limit = 10 
  } = req.query;
  
  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    filter.role = role;
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const count = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  
  res.json({
    users,
    page: Number(page),
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  user.isActive = req.body.isActive;
  await user.save();
  
  res.json({ message: 'User status updated', user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }});
});

// @desc    Get all tasks with filtering, sorting, pagination
// @route   GET /api/admin/tasks
// @access  Private/Admin
const getTasks = asyncHandler(async (req, res) => {
  const { 
    search, 
    status, 
    category,
    sort = '-createdAt',
    page = 1, 
    limit = 10 
  } = req.query;
  
  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    filter.status = status;
  }
  
  if (category) {
    filter.category = category;
  }
  
  const count = await Task.countDocuments(filter);
  const tasks = await Task.find(filter)
    .populate('customer', 'name email')
    .populate('category', 'name')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  
  res.json({
    tasks,
    page: Number(page),
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Delete task
// @route   DELETE /api/admin/tasks/:id
// @access  Private/Admin
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  // Also delete all bids associated with this task
  await Bid.deleteMany({ task: task._id });
  
  await task.deleteOne();
  res.json({ message: 'Task and associated bids removed' });
});

// @desc    Get detailed reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = asyncHandler(async (req, res) => {
  const { reportType, timeRange = '30days' } = req.query;
  
  let startDate = new Date();
  
  // Determine time range
  if (timeRange === '7days') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (timeRange === '30days') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (timeRange === '90days') {
    startDate.setDate(startDate.getDate() - 90);
  } else if (timeRange === '1year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  let report = {};
  
  // Generate report based on type
  if (reportType === 'users') {
    // User registration by date
    const usersByDate = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // User distribution by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);
    
    report = {
      usersByDate,
      usersByRole
    };
  } else if (reportType === 'tasks') {
    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Tasks by category
    const tasksByCategory = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      {
        $unwind: "$categoryData"
      },
      {
        $group: {
          _id: "$categoryData.name",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Tasks created over time
    const tasksByDate = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    report = {
      tasksByStatus,
      tasksByCategory,
      tasksByDate
    };
  } else if (reportType === 'earnings') {
    // Calculate platform earnings by date
    const earningsByDate = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          earnings: { $sum: { $multiply: ["$budget", 0.10] } } // Assuming 10% platform fee
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Earnings by category
    const earningsByCategory = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      {
        $unwind: "$categoryData"
      },
      {
        $group: {
          _id: "$categoryData.name",
          earnings: { $sum: { $multiply: ["$budget", 0.10] } } // Assuming 10% platform fee
        }
      },
      {
        $sort: { earnings: -1 }
      }
    ]);
    
    report = {
      earningsByDate,
      earningsByCategory
    };
  }
  
  res.json(report);
});

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  getTasks,
  deleteTask,
  getReports
}; 