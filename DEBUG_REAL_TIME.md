# Debug: Real-Time Update System

## How to Test in Browser Console

Open DevTools (F12) in your browser and paste these commands:

### Check Socket Connection
```javascript
// Check if socket is connected
console.log('Socket connected:', window.socketService?.getSocket()?.connected);

// Get socket object
const socket = window.socketService?.getSocket();
console.log('Socket:', socket);
```

### Check Real-Time Service Initialization
```javascript
// Check if realtimeService has socket
console.log('realtimeService socket:', window.realtimeService?.socket);

// Check setupListeners
console.log('Setup listeners:', window.realtimeService?.setupListeners);

// Check callbacks registered
console.log('Callbacks:', window.realtimeService?.callbacks);
```

### Listen for All Notifications (Debug)
```javascript
// In socket.js, you can add this to listen for all notifications
const socket = window.socketService?.getSocket();
if (socket) {
  socket.on('notification', (data) => {
    console.log('[DEBUG] Raw notification received:', data);
  });
}
```

## What to Look For in Console

After loading the page, you should see:

1. **Socket Connection:**
   ```
   Socket connected
   [RealtimeService] Socket initialized
   ```

2. **Subscriptions Being Set Up:**
   ```
   [RealtimeService] Subscribing to "task_status_changed" with id "task-{taskId}"
   [RealtimeService] First subscription to "task_status_changed", setting up socket listener
   [RealtimeService] Setting up listener for eventType: task_status_changed, socketEvent: notification
   ```

3. **When a Notification Arrives:**
   ```
   [RealtimeService] Real-time event received on notification: {type: 'task_started', ...}
   [RealtimeService] Mapped notification type "task_started" to event "task_status_changed", shouldTrigger for "task_status_changed": true
   [RealtimeService] Triggering callbacks for event type: task_status_changed
   ```

## If Nothing Shows Up

1. **Check socket connection first:**
   ```javascript
   window.socketService?.getSocket()?.connected  // Should be true
   ```

2. **Check if realtimeService is initialized:**
   ```javascript
   window.realtimeService?.socket  // Should not be null
   ```

3. **Manually trigger a test notification:**
   ```javascript
   const socket = window.socketService?.getSocket();
   socket?.emit('test', {message: 'test'});
   ```

## Critical Files to Check

If debugging:
1. Open DevTools → Network → WS tab
2. Should see WebSocket connection to `localhost:5000/socket.io/`
3. Connection status should show "101 Switching Protocols"

## Running a Full Test

1. Open 2 browser windows (customer and tasker)
2. Both should show these console logs on page load
3. When tasker clicks "Start Task", check console for notifications on customer side
4. Should see all the notification receive and callback trigger logs

## Expected Flow

```
Customer Window:
1. Page loads
2. AuthContext initializes socket → "Socket connected"
3. TaskDetailPage mounts
4. useTasks hook subscribes to "task_status_changed" → "[RealtimeService] Subscribing to..."
5. Listener setup → "[RealtimeService] Setting up listener..."

Tasker Window:
1. Clicks "Start Task"
2. API call to /tasks/:id/start
3. Backend creates notification in database
4. Backend emits 'notification' event to customer's socket

Customer Window (continued):
5. Socket receives notification → "[RealtimeService] Real-time event received..."
6. Maps notification type and triggers callbacks
7. Redux action dispatched
8. Component re-renders with new data
```

## Troubleshooting Commands

```javascript
// Force a test notification to specific socket
const socket = window.socketService?.getSocket();
const fakeNotification = {
  type: 'task_started',
  message: 'Test notification',
  data: { taskId: 'test-id' }
};
socket?.emit('notification', fakeNotification);  // Test emit back to server

// Manually trigger callback for testing
window.realtimeService?._triggerCallbacks('task_status_changed', {
  type: 'task_started',
  taskId: 'your-task-id'
});
```

## Next Steps

1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload both backend and frontend
3. Open 2 browser windows
4. Check console logs using the commands above
5. Verify the sequence shown in "Expected Flow"
6. If anything is missing, check the "If Nothing Shows Up" section
