const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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