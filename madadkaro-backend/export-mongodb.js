#!/usr/bin/env node

/**
 * MongoDB Data Export Script
 * Exports all collections from local MongoDB to JSON files
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/madadkaro';
const BACKUP_DIR = './mongodb-backup';
const DB_NAME = 'madadkaro';

async function exportDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get database reference
    const db = mongoose.connection.db;

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);

    if (collections.length === 0) {
      console.log('⚠️  No collections found in database');
      await mongoose.connection.close();
      return;
    }

    // Export each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n⏳ Exporting collection: ${collectionName}...`);

      try {
        const col = db.collection(collectionName);
        const documents = await col.find({}).toArray();

        // Save to JSON file
        const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

        console.log(`✅ Exported ${documents.length} documents to ${filePath}`);
      } catch (error) {
        console.error(`❌ Error exporting ${collectionName}:`, error.message);
      }
    }

    console.log('\n✅ Export complete!');
    console.log(`📁 Backup location: ${path.resolve(BACKUP_DIR)}`);
    console.log(`\nTo restore this data later, run:`);
    console.log(`  npm run db:import-atlas`);

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run export
exportDatabase();
