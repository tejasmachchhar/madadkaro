const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { storeDeviceToken, removeDeviceToken } = require('../services/pushNotificationService');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
    phone,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture,
      bio: user.bio,
      addresses: user.addresses, // Changed from location
      skills: user.skills,
      hourlyRate: user.hourlyRate,
      rating: user.rating,
      reviewCount: user.reviewCount,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.bio = req.body.bio || user.bio;
    // user.location = req.body.location || user.location; // Replaced by address management
    user.skills = req.body.skills || user.skills;
    user.hourlyRate = req.body.hourlyRate || user.hourlyRate;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      addresses: updatedUser.addresses, // Changed from location
      skills: updatedUser.skills,
      hourlyRate: updatedUser.hourlyRate,
      rating: updatedUser.rating,
      reviewCount: updatedUser.reviewCount,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    user.isVerified = req.body.isVerified !== undefined ? req.body.isVerified : user.isVerified;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      isVerified: updatedUser.isVerified,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Register device token for push notifications
// @route   POST /api/users/device-token
// @access  Private
const registerDeviceToken = asyncHandler(async (req, res) => {
  const { deviceToken } = req.body;

  if (!deviceToken) {
    res.status(400);
    throw new Error('Device token is required');
  }

  const success = await storeDeviceToken(req.user._id, deviceToken);

  if (success) {
    res.json({ message: 'Device token registered successfully' });
  } else {
    res.status(500);
    throw new Error('Failed to register device token');
  }
});

// @desc    Remove device token for push notifications
// @route   DELETE /api/users/device-token
// @access  Private
const unregisterDeviceToken = asyncHandler(async (req, res) => {
  const { deviceToken } = req.body;

  if (!deviceToken) {
    res.status(400);
    throw new Error('Device token is required');
  }

  const success = await removeDeviceToken(req.user._id, deviceToken);

  if (success) {
    res.json({ message: 'Device token removed successfully' });
  } else {
    res.status(500);
    throw new Error('Failed to remove device token');
  }
});

// @desc    Add a new address for a user
// @route   POST /api/users/profile/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const { label, pincode, houseNoBuilding, areaColony, landmark, city, state, isDefault } = req.body;

  if (!pincode || !houseNoBuilding || !areaColony || !city || !state) {
    res.status(400);
    throw new Error('Please provide all required address fields: pincode, houseNoBuilding, areaColony, city, state');
  }

  const user = await User.findById(req.user._id);

  if (user) {
    const newAddress = {
      label: label || 'Home', // Default label if not provided
      pincode,
      houseNoBuilding,
      areaColony,
      landmark,
      city,
      state,
      isDefault: isDefault || false,
    };

    // If this new address is set as default, unset other defaults
    if (newAddress.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    // If no other address is default and this is not set as default, make it default (first address added)
    else if (user.addresses.length === 0) {
        newAddress.isDefault = true;
    }


    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json(user.addresses);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all addresses for a user
// @route   GET /api/users/profile/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json(user.addresses);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update an existing address for a user
// @route   PUT /api/users/profile/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const { label, pincode, houseNoBuilding, areaColony, landmark, city, state, isDefault } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    const address = user.addresses.id(req.params.addressId);
    if (address) {
      address.label = label || address.label;
      address.pincode = pincode || address.pincode;
      address.houseNoBuilding = houseNoBuilding || address.houseNoBuilding;
      address.areaColony = areaColony || address.areaColony;
      address.landmark = landmark !== undefined ? landmark : address.landmark; // Allow empty string for landmark
      address.city = city || address.city;
      address.state = state || address.state;

      if (isDefault !== undefined) {
        // If this address is being set as default, unset other defaults
        if (isDefault) {
          user.addresses.forEach(addr => {
            if (addr._id.toString() !== req.params.addressId) {
              addr.isDefault = false;
            }
          });
        }
        address.isDefault = isDefault;
      }
      
      // Ensure at least one address is default if this one is being unset
      if (isDefault === false && user.addresses.filter(addr => addr.isDefault).length === 0) {
        // If unsetting the only default, find another to set as default or set this one back
        const otherAddress = user.addresses.find(addr => addr._id.toString() !== req.params.addressId);
        if(otherAddress) otherAddress.isDefault = true;
        else address.isDefault = true; // If it's the only address, it must be default
      }

      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404);
      throw new Error('Address not found');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete an address for a user
// @route   DELETE /api/users/profile/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const address = user.addresses.id(req.params.addressId);
    if (address) {
      const wasDefault = address.isDefault;
      address.deleteOne(); // Mongoose subdocument remove method
      
      // If the deleted address was the default, and there are other addresses, set the first one as default
      if (wasDefault && user.addresses.length > 0) {
        if (!user.addresses.some(addr => addr.isDefault)) {
            user.addresses[0].isDefault = true;
        }
      }

      await user.save();
      res.json({ message: 'Address removed', addresses: user.addresses });
    } else {
      res.status(404);
      throw new Error('Address not found');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Set a default address for a user
// @route   PUT /api/users/profile/addresses/:addressId/default
// @access  Private
const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const addressToSetDefault = user.addresses.id(req.params.addressId);
    if (addressToSetDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = addr._id.equals(addressToSetDefault._id);
      });
      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404);
      throw new Error('Address not found');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
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
  // Address management
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};