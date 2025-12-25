import io from 'socket.io-client';
import { toast } from 'react-toastify';

// Hardcode API URL for now
const API_URL = 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('notification', (notification) => {
    // Handle different notification types
    switch (notification.type) {
      case 'new_bid':
        toast.info(notification.message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for bid placed
        socket.emit('bid_placed', {
          taskId: notification.data.taskId,
          ...notification.data
        });
        // Update notification count or list if needed
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        break;
      case 'bid_accepted':
        toast.success(notification.message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for bid status change
        socket.emit('bid_status_changed', {
          taskId: notification.data.taskId,
          status: 'accepted',
          ...notification.data
        });
        // Update notification count or list if needed
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        break;
      case 'bid_rejected':
        const message = notification.data.reason
          ? `${notification.message} Reason: ${notification.data.reason}`
          : notification.message;
        
        toast.error(message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for bid status change
        socket.emit('bid_status_changed', {
          taskId: notification.data.taskId,
          status: 'rejected',
          ...notification.data
        });
        // Update notification count or list if needed
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        break;
      // Task status notifications
      case 'task_started':
        toast.success(notification.message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for task status change
        socket.emit('task_status_changed', {
          taskId: notification.data.taskId,
          status: 'inProgress',
          ...notification.data
        });
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        if (window.refreshTaskDetails && notification.data.taskId) {
          window.refreshTaskDetails(notification.data.taskId);
        }
        break;
      case 'completion_requested':
        toast.info(notification.message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for task status change
        socket.emit('task_status_changed', {
          taskId: notification.data.taskId,
          status: 'completionRequested',
          ...notification.data
        });
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        if (window.refreshTaskDetails && notification.data.taskId) {
          window.refreshTaskDetails(notification.data.taskId);
        }
        break;
      case 'task_completed':
      case 'completion_confirmed':
        toast.success(notification.message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for task status change
        socket.emit('task_status_changed', {
          taskId: notification.data.taskId,
          status: 'completed',
          ...notification.data
        });
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        if (window.refreshTaskDetails && notification.data.taskId) {
          window.refreshTaskDetails(notification.data.taskId);
        }
        break;
      case 'task_completion_rejected':
      case 'completion_rejected':
        toast.error(notification.message, {
          onClick: () => {
            window.location.href = `/tasks/${notification.data.taskId}`;
          }
        });
        // Emit real-time event for task status change
        socket.emit('task_status_changed', {
          taskId: notification.data.taskId,
          status: 'inProgress',
          ...notification.data
        });
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        if (window.refreshTaskDetails && notification.data.taskId) {
          window.refreshTaskDetails(notification.data.taskId);
        }
        break;
      default:
        toast.info(notification.message);
        if (window.updateNotifications) {
          window.updateNotifications();
        }
        break;
    }
  });

  // Listen for new chat messages
  socket.on('new_message', (message) => {
    // Show a toast notification for the new message
    if (message.sender && message.content) {
      toast.info(`New message from ${message.sender.name}`, {
        onClick: () => {
          window.location.href = `/tasks/${message.task}`;
        }
      });
      
      // Trigger any callbacks registered to handle new messages
      if (window.onNewMessage) {
        window.onNewMessage(message);
      }
    }
  });

  return socket;
};

export const sendMessage = (messageData) => {
  if (socket) {
    socket.emit('send_message', messageData);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  disconnectSocket,
  sendMessage,
  getSocket: () => socket
}; 