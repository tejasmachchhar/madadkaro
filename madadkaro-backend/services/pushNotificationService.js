const admin = require('firebase-admin');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let firebaseInitialized = false;

try {
  // Try to load from file first (for local development)
  const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized from file');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use environment variable (for production)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized from environment variable');
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Use individual environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized from individual environment variables');
  } else {
    console.warn('Firebase Admin not initialized: No service account file or environment variables found. Push notifications will be disabled.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.warn('Push notifications will be disabled.');
}

// Store device tokens for users
const storeDeviceToken = async (userId, deviceToken) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { deviceTokens: deviceToken }
    });
    return true;
  } catch (error) {
    console.error('Error storing device token:', error);
    return false;
  }
};

// Remove device token for a user
const removeDeviceToken = async (userId, deviceToken) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { deviceTokens: deviceToken }
    });
    return true;
  } catch (error) {
    console.error('Error removing device token:', error);
    return false;
  }
};

// Send push notification to a user
const sendPushNotification = async (userId, notification) => {
  try {
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Push notification skipped.');
      return false;
    }

    const user = await User.findById(userId);
    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      return false;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        taskId: notification.task ? notification.task.toString() : '',
        bidId: notification.bid ? notification.bid.toString() : '',
        ...notification.data
      },
      tokens: user.deviceTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(user.deviceTokens[idx]);
        }
      });
      
      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { deviceTokens: { $in: invalidTokens } }
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

module.exports = {
  storeDeviceToken,
  removeDeviceToken,
  sendPushNotification
}; 