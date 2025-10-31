const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    icon: {
      type: String // Icon identifier or path
    },
    priceRange: {
      min: {
        type: Number,
        required: [true, 'Please add minimum price']
      },
      max: {
        type: Number,
        required: [true, 'Please add maximum price']
      }
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null // null means it's a main category
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

module.exports = mongoose.model('Category', categorySchema); 