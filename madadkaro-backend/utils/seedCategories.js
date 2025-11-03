const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

// Initial categories data with subcategories
const categories = [
  {
    name: 'Cleaning',
    description: 'Home and office cleaning services',
    icon: '🧹',
    priceRange: { min: 200, max: 800 },
    subcategories: [
      {
        name: 'Cleaning - House Cleaning',
        description: 'General house cleaning services',
        icon: '🏠',
        priceRange: { min: 200, max: 500 }
      },
      {
        name: 'Cleaning - Deep Cleaning',
        description: 'Thorough cleaning of specific areas',
        icon: '✨',
        priceRange: { min: 400, max: 800 }
      },
      {
        name: 'Cleaning - Window Cleaning',
        description: 'Interior and exterior window cleaning',
        icon: '🪟',
        priceRange: { min: 300, max: 600 }
      },
      {
        name: 'Cleaning - Carpet Cleaning',
        description: 'Professional carpet cleaning services',
        icon: '🧶',
        priceRange: { min: 350, max: 700 }
      }
    ]
  },
  {
    name: 'Handyman',
    description: 'General repair and maintenance services',
    icon: '🔧',
    priceRange: { min: 300, max: 1500 },
    subcategories: [
      {
        name: 'Handyman - Plumbing',
        description: 'Fixing leaks, installations and repairs',
        icon: '🚰',
        priceRange: { min: 300, max: 800 }
      },
      {
        name: 'Handyman - Electrical',
        description: 'Wiring, fixtures and electrical repairs',
        icon: '⚡',
        priceRange: { min: 400, max: 1200 }
      },
      {
        name: 'Handyman - Carpentry',
        description: 'Woodwork and furniture assembly',
        icon: '🪚',
        priceRange: { min: 350, max: 1500 }
      },
      {
        name: 'Handyman - Painting',
        description: 'Interior and exterior painting services',
        icon: '🎨',
        priceRange: { min: 500, max: 1500 }
      }
    ]
  },
  {
    name: 'Moving',
    description: 'Help with moving and transportation',
    icon: '📦',
    priceRange: { min: 500, max: 3000 },
    subcategories: [
      {
        name: 'Moving - Furniture Moving',
        description: 'Moving furniture within home or to new location',
        icon: '🪑',
        priceRange: { min: 500, max: 1500 }
      },
      {
        name: 'Moving - Home Shifting',
        description: 'Complete home relocation services',
        icon: '🏠',
        priceRange: { min: 1000, max: 3000 }
      },
      {
        name: 'Moving - Packing Services',
        description: 'Help with packing belongings securely',
        icon: '📦',
        priceRange: { min: 300, max: 1000 }
      },
      {
        name: 'Moving - Vehicle Transport',
        description: 'Transport vehicles to new locations',
        icon: '🚗',
        priceRange: { min: 800, max: 2500 }
      }
    ]
  },
  {
    name: 'Delivery',
    description: 'Delivery and courier services',
    icon: '🚚',
    priceRange: { min: 100, max: 600 },
    subcategories: [
      {
        name: 'Delivery - Food Delivery',
        description: 'Deliver food from restaurants or groceries',
        icon: '🍔',
        priceRange: { min: 100, max: 300 }
      },
      {
        name: 'Delivery - Package Delivery',
        description: 'Transport packages across town',
        icon: '📦',
        priceRange: { min: 150, max: 400 }
      },
      {
        name: 'Delivery - Grocery Delivery',
        description: 'Buy and deliver groceries',
        icon: '🛒',
        priceRange: { min: 200, max: 500 }
      },
      {
        name: 'Delivery - Medicine Delivery',
        description: 'Pick up and deliver medicines',
        icon: '💊',
        priceRange: { min: 100, max: 300 }
      }
    ]
  },
  {
    name: 'Gardening',
    description: 'Garden maintenance and landscaping',
    icon: '🌱',
    priceRange: { min: 250, max: 1200 },
    subcategories: [
      {
        name: 'Gardening - Lawn Mowing',
        description: 'Regular lawn maintenance',
        icon: '🌿',
        priceRange: { min: 250, max: 500 }
      },
      {
        name: 'Gardening - Plant Care',
        description: 'Watering, pruning and plant health',
        icon: '🌺',
        priceRange: { min: 300, max: 600 }
      },
      {
        name: 'Gardening - Landscaping',
        description: 'Garden design and landscaping',
        icon: '🏡',
        priceRange: { min: 500, max: 1200 }
      },
      {
        name: 'Gardening - Tree Trimming',
        description: 'Tree maintenance and branch removal',
        icon: '🌳',
        priceRange: { min: 400, max: 1000 }
      }
    ]
  },
  {
    name: 'Shopping',
    description: 'Personal shopping and errand services',
    icon: '🛒',
    priceRange: { min: 150, max: 800 },
    subcategories: [
      {
        name: 'Shopping - Grocery Shopping',
        description: 'Buy and deliver groceries',
        icon: '🥕',
        priceRange: { min: 150, max: 400 }
      },
      {
        name: 'Shopping - Clothing Shopping',
        description: 'Personal shopping for clothes',
        icon: '👕',
        priceRange: { min: 200, max: 500 }
      },
      {
        name: 'Shopping - Gift Shopping',
        description: 'Help with gift selection and purchase',
        icon: '🎁',
        priceRange: { min: 200, max: 600 }
      },
      {
        name: 'Shopping - General Errands',
        description: 'Run various errands and tasks',
        icon: '📝',
        priceRange: { min: 150, max: 800 }
      }
    ]
  },
  {
    name: 'Technology',
    description: 'Tech support and digital services',
    icon: '💻',
    priceRange: { min: 400, max: 2500 },
    subcategories: [
      {
        name: 'Technology - Computer Repair',
        description: 'Hardware and software troubleshooting',
        icon: '🖥️',
        priceRange: { min: 400, max: 1500 }
      },
      {
        name: 'Technology - Smartphone Help',
        description: 'Smartphone setup and troubleshooting',
        icon: '📱',
        priceRange: { min: 300, max: 1000 }
      },
      {
        name: 'Technology - WiFi Setup',
        description: 'Internet and network setup',
        icon: '📶',
        priceRange: { min: 500, max: 1500 }
      },
      {
        name: 'Technology - Smart Home Setup',
        description: 'Installation of smart home devices',
        icon: '🏠',
        priceRange: { min: 600, max: 2500 }
      }
    ]
  },
  {
    name: 'Other',
    description: 'Other miscellaneous services',
    icon: '📋',
    priceRange: { min: 200, max: 1000 },
    subcategories: [
      {
        name: 'Other - Pet Care',
        description: 'Pet sitting and walking services',
        icon: '🐾',
        priceRange: { min: 200, max: 500 }
      },
      {
        name: 'Other - Event Help',
        description: 'Assistance with event setup and management',
        icon: '🎉',
        priceRange: { min: 300, max: 1000 }
      },
      {
        name: 'Other - Teaching/Tutoring',
        description: 'Educational assistance and tutoring',
        icon: '📚',
        priceRange: { min: 250, max: 800 }
      },
      {
        name: 'Other - Custom Services',
        description: 'Other services not listed elsewhere',
        icon: '✨',
        priceRange: { min: 200, max: 1000 }
      }
    ]
  }
];

// Utility to slugify names consistently
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Import (seed) function with idempotent upserts
const importCategories = async () => {
  try {
    for (const category of categories) {
      const { name, description, icon, priceRange, subcategories } = category;

      // Upsert main category
      const mainSlug = slugify(name);
      const mainCategory = await Category.findOneAndUpdate(
        { slug: mainSlug },
        {
          name,
          slug: mainSlug,
          description: description || '',
          icon: icon || '',
          priceRange: priceRange || { min: 0, max: 0 },
          parentCategory: null,
          isActive: true
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      console.log(`Seeded category: ${mainCategory.name}`);

      // Upsert subcategories
      if (Array.isArray(subcategories)) {
        for (const sub of subcategories) {
          const subName = sub.name;
          const subSlug = slugify(subName);
          const subDoc = await Category.findOneAndUpdate(
            { slug: subSlug },
            {
              name: subName,
              slug: subSlug,
              description: sub.description || '',
              icon: sub.icon || '',
              priceRange: sub.priceRange || { min: 0, max: 0 },
              parentCategory: mainCategory._id,
              isActive: true
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );

          console.log(`  ↳ Seeded subcategory: ${subDoc.name}`);
        }
      }
    }

    console.log('Categories seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete function
const deleteCategories = async () => {
  try {
    await Category.deleteMany();
    console.log('Categories deleted from database');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Execute based on command line args
if (process.argv[2] === '-d') {
  deleteCategories();
} else {
  importCategories();
}