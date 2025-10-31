const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserById,
  getUsers,
  deleteUser,
  updateUser,
  registerDeviceToken,
  unregisterDeviceToken,
  // Address management controllers
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public Routes
router.post('/', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('profilePicture'), updateUserProfile);

// Admin Routes
router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

router.route('/device-token')
  .post(protect, registerDeviceToken)
  .delete(protect, unregisterDeviceToken);

// Protected Routes for Address Management
router.route('/profile/addresses')
  .post(protect, addAddress) // Add a new address
  .get(protect, getAddresses); // Get all addresses

router.route('/profile/addresses/:addressId')
  .put(protect, updateAddress) // Update a specific address
  .delete(protect, deleteAddress); // Delete a specific address

router.route('/profile/addresses/:addressId/default')
  .put(protect, setDefaultAddress); // Set an address as default

module.exports = router;