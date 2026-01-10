#!/usr/bin/env node

/**
 * MongoDB Atlas Data Import Script
 * Imports JSON backup data to MongoDB Atlas
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configuration
const ATLAS_URI = process.env.MONGO_URI;
const BACKUP_DIR = './mongodb-backup';

async function importDatabase() {
  // Validate Atlas URI
  if (!ATLAS_URI) {
    console.error('❌ Error: MONGO_URI environment variable not set');
    console.error('Please set it in your .env file:');
    console.error('  MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/madadkaro');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    // Connect to Atlas
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get database reference
    const db = mongoose.connection.db;

    // Get list of JSON files
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error(`❌ Backup directory not found: ${BACKUP_DIR}`);
      console.error('Please run export-mongodb.js first');
      process.exit(1);
    }

    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
    console.log(`📊 Found ${files.length} backup files`);

    if (files.length === 0) {
      console.error('❌ No JSON backup files found');
      process.exit(1);
    }

    // Import each collection
    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      console.log(`\n⏳ Importing collection: ${collectionName}...`);

      try {
        const filePath = path.join(BACKUP_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (data.length === 0) {
          console.log(`⚠️  No documents to import for ${collectionName}`);
          continue;
        }

        const col = db.collection(collectionName);
        
        // Clear existing data (optional - comment out to keep existing data)
        await col.deleteMany({});
        console.log(`🗑️  Cleared existing documents`);

        // Insert documents
        const result = await col.insertMany(data);
        console.log(`✅ Imported ${result.insertedCount} documents to ${collectionName}`);

      } catch (error) {
        console.error(`❌ Error importing ${collectionName}:`, error.message);
      }
    }

    console.log('\n✅ Import complete!');
    console.log('📊 Verify your data in MongoDB Atlas console');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your MONGODB_ATLAS_URI in .env');
    console.error('2. Verify username/password are correct');
    console.error('3. Ensure your IP is whitelisted in Atlas Network Access');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Run import
importDatabase();
