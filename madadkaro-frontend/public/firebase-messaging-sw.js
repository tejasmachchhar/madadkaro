importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAMHxpn1Ifu9mgrXUmlzQYCRATGFWD3oGs",
    authDomain: "madadkaro-c280f.firebaseapp.com",
    projectId: "madadkaro-c280f",
    storageBucket: "madadkaro-c280f.firebasestorage.app",
    messagingSenderId: "684013202850",
    appId: "1:684013202850:web:2774676631d79b8d73d6fb",
    measurementId: "G-E009H12P9S"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  const options = {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { taskId, type } = event.notification.data;
  
  if (taskId) {
    event.waitUntil(
      clients.openWindow(`/tasks/${taskId}`)
    );
  }
}); 