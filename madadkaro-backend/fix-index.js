const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/madadkaro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB');

  try {
    // Drop the old 2dsphere index if it exists
    const collection = db.collection('tasks');
    const indexes = await collection.indexes();

    const locationIndex = indexes.find(index =>
      index.name.includes('location') && index.key.location === '2dsphere'
    );

    if (locationIndex) {
      console.log('Found existing location index:', locationIndex.name);
      await collection.dropIndex(locationIndex.name);
      console.log('Dropped old location index');
    } else {
      console.log('No existing location index found');
    }

    console.log('Index fix completed. Restart your server to recreate the sparse index.');
  } catch (error) {
    console.error('Error fixing index:', error);
  } finally {
    mongoose.connection.close();
  }
});
