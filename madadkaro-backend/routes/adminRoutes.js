const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUserStatus,
  getTasks,
  deleteTask,
  getReports
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected with admin middleware
router.use(protect, admin);

// Stats and dashboard data
router.route('/stats').get(getStats);

// User management
router.route('/users').get(getUsers);
router.route('/users/:id/status').put(updateUserStatus);

// Task management
router.route('/tasks').get(getTasks);
router.route('/tasks/:id').delete(deleteTask);

// Reports
router.route('/reports').get(getReports);

module.exports = router; 