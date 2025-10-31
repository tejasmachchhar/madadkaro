const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      required: true,
      enum: ['customer', 'tasker', 'admin'],
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    skills: [{
      type: String,
    }],
    addresses: [
      {
        label: { type: String, required: true, trim: true, default: 'Home' }, // e.g., Home, Work, Other
        pincode: { type: String, required: true, trim: true },
        houseNoBuilding: { type: String, required: true, trim: true },
        areaColony: { type: String, required: true, trim: true },
        landmark: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    // location: { // This will be replaced by the addresses array
    //   type: String,
    //   default: '',
    // },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deviceTokens: [{
      type: String
    }],
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);