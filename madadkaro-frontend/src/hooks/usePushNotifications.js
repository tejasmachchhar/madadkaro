import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import api from '../services/api';

const firebaseConfig = {
  apiKey: "AIzaSyAMHxpn1Ifu9mgrXUmlzQYCRATGFWD3oGs",
  authDomain: "madadkaro-c280f.firebaseapp.com",
  projectId: "madadkaro-c280f",
  storageBucket: "madadkaro-c280f.firebasestorage.app",
  messagingSenderId: "684013202850",
  appId: "1:684013202850:web:2774676631d79b8d73d6fb",
  measurementId: "G-E009H12P9S"
};

const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  useEffect(() => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Check if push notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setIsPermissionGranted(Notification.permission === 'granted');
    }

    // Request permission and register token
    const requestPermission = async () => {
      try {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('Permission status:', permission);
        setIsPermissionGranted(permission === 'granted');

        if (permission === 'granted') {
          console.log('Getting FCM token...');
          const token = await getToken(messaging, {
            vapidKey: 'BIXWTNX6H8hx63RulvUSGEfM9PN3_YG035479C2DoZPVAKIcFP2zt24mI_7p2Qrui67eNhhOWHolteRZLkvz9vE'
          });
          console.log('FCM Token:', token);

          // Register token with backend
          console.log('Registering token with backend...');
          await api.post('/users/device-token', { deviceToken: token });
          console.log('Token registered successfully');
        }
      } catch (error) {
        console.error('Error in notification setup:', error);
      }
    };

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      const { title, body } = payload.notification;
      new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
    });

    if (isSupported && !isPermissionGranted) {
      requestPermission();
    }

    return () => {
      unsubscribe();
    };
  }, [isSupported, isPermissionGranted]);

  return {
    isSupported,
    isPermissionGranted
  };
};

export default usePushNotifications; 