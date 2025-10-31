const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  getUserTasks,
  getTaskAddresses, // Changed from getTaskLocations
  getTaskCategories,
  requestTaskCompletion,
  confirmTaskCompletion,
  rejectTaskCompletion,
  addTaskerFeedback,
} = require('../controllers/taskController');
const { protect, customer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public Routes
router.get('/', protect, getTasks);
router.get('/addresses', getTaskAddresses); // Changed from /locations and getTaskLocations
router.get('/categories', getTaskCategories);

// Protected Routes
router.get('/:id', protect, getTaskById);
router.post('/', protect, customer, upload.array('images', 5), createTask);
router.put('/:id', protect, customer, upload.array('images', 5), updateTask);
router.delete('/:id', protect, customer, deleteTask);
router.put('/:id/assign', protect, customer, assignTask);
router.get('/user/myTasks', protect, getUserTasks);

// Task Status Routes
router.put('/:id/status', protect, updateTaskStatus);
router.put('/:id/start', protect, updateTaskStatus);

// Task Completion Routes
router.put('/:id/request-completion', protect, requestTaskCompletion);
router.put('/:id/confirm-completion', protect, customer, confirmTaskCompletion);
router.put('/:id/reject-completion', protect, customer, rejectTaskCompletion);
router.put('/:id/tasker-feedback', protect, addTaskerFeedback);

module.exports = router;