## Live Page Updates Without Reload - Implementation Guide

This document explains the real-time update system that automatically refreshes page content when notifications are received, without requiring manual page reload.

### Overview

The system works by:
1. Listening to real-time events via Socket.io
2. Dispatching Redux actions to update the state
3. Components automatically re-render when their Redux state changes
4. Pages set up subscriptions to relevant real-time events

### Architecture

#### 1. **realtimeService** (`src/services/realtimeService.js`)
A singleton service that manages subscriptions to real-time events. It provides:
- Centralized event subscription management
- Callback registration for specific event types
- Auto-unsubscription support
- Multiple subscription types for different features

**Key Methods:**
- `subscribe(eventType, callback, id)` - Register a callback for an event type
- `subscribeToTaskUpdates(taskId, callback)` - Subscribe to task updates
- `subscribeToBidUpdates(taskId, callback)` - Subscribe to bid changes
- `subscribeToUserTasks(callback)` - Subscribe to user's task changes
- `subscribeToUserBids(callback)` - Subscribe to user's bid changes
- `subscribeToMessages(taskId, callback)` - Subscribe to messages
- `subscribeToReviews(taskId, callback)` - Subscribe to reviews

#### 2. **Enhanced Socket Service** (`src/services/socket.js`)
Updated to emit structured events based on notification types:
- `task_updated` - When a task is modified
- `task_status_changed` - When a task status changes
- `bid_placed` - When a new bid is created
- `bid_status_changed` - When a bid status changes
- `bid_updated` - When a bid is modified
- `message_received` - When a new message arrives
- `review_added` - When a review is submitted

#### 3. **Redux Slices** 
Added synchronous reducers to handle real-time updates:
- `updateTaskDetailFromSocket` - Update task detail in store
- `updateTaskInList` - Update task in customer/available tasks lists
- `updateBidFromSocket` - Update bid in store
- `addBidToTask` - Add new bid to task

#### 4. **Custom Hooks** 
Updated with real-time listeners:
- `useTasks()` - Now listens for task status changes
- `useBids()` - Now listens for bid updates
- `useReviews()` - Now listens for review additions

#### 5. **Pages Updated**
Added real-time listeners to key pages:
- `TaskDetailPage` - Listens for task and bid updates
- `MyTasksPage` - Listens for task status changes
- `TasksPage` - Listens for task status changes (removes non-open tasks)
- `MyBidsPage` - Listens for bid status and task changes

### How It Works

#### Step 1: Notification is Received
When a notification is received via Socket.io (e.g., "new_bid"):

```javascript
// In socket.js notification handler
case 'new_bid':
  socket.emit('bid_placed', {
    taskId: notification.data.taskId,
    ...notification.data
  });
```

#### Step 2: Real-time Event is Triggered
The notification handler emits a real-time event that listeners can subscribe to.

#### Step 3: Subscribers are Notified
Any component with an active subscription receives the event:

```javascript
// In TaskDetailPage or other component
const unsubscribeBidUpdates = realtimeService.subscribeToBidUpdates(taskId, (data) => {
  fetchTaskDetails();
});
```

#### Step 4: Data is Refetched/Updated
The component either:
- Refetches data from the API (most reliable)
- Updates Redux state optimistically using the new data

#### Step 5: UI Automatically Updates
React re-renders the component with the new data, no reload needed.

### Real-Time Event Flow Diagram

```
User Action (e.g., Accept Bid)
        ↓
Backend creates notification
        ↓
Socket.io broadcasts notification
        ↓
Frontend notification handler
        ↓
Emits real-time event (e.g., 'bid_placed')
        ↓
realtimeService triggers callbacks
        ↓
Subscribed components refetch data / update Redux
        ↓
Redux state changes
        ↓
React components re-render with new data
        ↓
User sees update WITHOUT page reload ✓
```

### Event Types and Handlers

| Event Type | Emitted When | Subscribers | Action |
|------------|-------------|-------------|--------|
| `task_updated` | Task is modified | TaskDetailPage | Refetch task details |
| `task_status_changed` | Task status changes | MyTasksPage, TasksPage, MyBidsPage | Refetch affected data |
| `bid_placed` | New bid created | TaskDetailPage, MyBidsPage | Refetch task/bid data |
| `bid_status_changed` | Bid accepted/rejected | MyBidsPage, TaskDetailPage | Refetch bid/task data |
| `bid_updated` | Bid is modified | MyBidsPage | Refetch bids |
| `message_received` | New message sent | ChatInterface | Refetch messages |
| `review_added` | Review submitted | TaskDetailPage, Profile pages | Refetch reviews |

### Example: Bid Acceptance Flow

1. **Customer accepts a bid on TaskDetailPage**
   - Backend creates a "bid_accepted" notification
   - Sends it to the tasker via Socket.io

2. **Tasker's browser receives notification**
   - `socket.js` notification handler processes it
   - Emits `'bid_status_changed'` event with status 'accepted'

3. **Tasker's MyBidsPage is listening**
   ```javascript
   const unsubBidStatus = realtimeService.subscribe('bid_status_changed', (data) => {
     fetchBids(); // Automatically refetch
   });
   ```

4. **Data is refetched and Redux is updated**
   - Bid status is now "accepted" in the store
   - MyBidsPage component re-renders with updated bid

5. **Tasker sees the acceptance instantly without reload!**

### Performance Considerations

1. **Polling Prevention**: Real-time events eliminate the need for polling
2. **Efficient Updates**: Components only refetch data for affected items
3. **Memory Management**: Subscriptions are properly cleaned up when components unmount
4. **Debouncing**: Multiple rapid updates are handled efficiently by the event system

### Debugging

To debug real-time updates:

1. **Check Socket Connection**
   ```javascript
   // In browser console
   socketService.getSocket()
   ```

2. **Monitor Events**
   - Open DevTools Network tab
   - Filter by "WS" to see WebSocket messages

3. **Check Subscriptions**
   ```javascript
   // In browser console
   realtimeService.subscriptions
   realtimeService.callbacks
   ```

4. **Enable Logging**
   - realtimeService logs all events to console with `console.log`
   - Check browser console for event details

### Future Improvements

1. **Optimistic Updates**: Update UI immediately before confirmation from server
2. **Conflict Resolution**: Handle cases where user makes change while real-time update arrives
3. **Batch Updates**: Combine multiple events to reduce re-renders
4. **Selective Refresh**: Only refresh affected components instead of entire pages
5. **Offline Support**: Queue updates when offline and sync when back online

### Files Modified

- `src/services/realtimeService.js` (NEW)
- `src/services/socket.js` (UPDATED)
- `src/store/slices/tasksSlice.js` (UPDATED)
- `src/store/slices/bidsSlice.js` (UPDATED)
- `src/hooks/useTasks.js` (UPDATED)
- `src/hooks/useBids.js` (UPDATED)
- `src/hooks/useReviews.js` (UPDATED)
- `src/pages/TaskDetailPage.jsx` (UPDATED)
- `src/pages/MyTasksPage.jsx` (UPDATED)
- `src/pages/TasksPage.jsx` (UPDATED)
- `src/pages/MyBidsPage.jsx` (UPDATED)

### Testing the System

1. **Open two browser windows** - one for customer, one for tasker
2. **On customer window**: Post a task or manage bids
3. **On tasker window**: Navigate to "My Tasks" or "My Bids"
4. **On customer window**: Perform an action (e.g., accept a bid)
5. **On tasker window**: Observe the page update automatically without refresh

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Page not updating | Check Socket.io connection status in console |
| Stale data shown | Verify Redux dispatch is being called in reducers |
| Memory leaks | Ensure unsubscribe functions are called in cleanup |
| Excessive re-renders | Check if multiple subscriptions to same event exist |

---

**Note**: This system requires the backend to emit socket events. Ensure your backend is properly configured to emit notifications via Socket.io for all relevant actions (bids, task updates, messages, reviews, etc.).
