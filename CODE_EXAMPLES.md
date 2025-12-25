## Real-time Updates - Code Examples & Quick Reference

### 1. Using Real-time Service in a Component

#### Example: Subscribe to Task Updates in TaskDetailPage

```javascript
import realtimeService from '../services/realtimeService';

function TaskDetailPage() {
  const { taskId } = useParams();
  const { getTaskDetail, taskDetail } = useTasks();
  
  useEffect(() => {
    // Fetch initial task details
    getTaskDetail(taskId);
    
    // Subscribe to real-time updates for this task
    const unsubscribe = realtimeService.subscribeToTaskUpdates(taskId, (data) => {
      // Refetch task details when update arrives
      getTaskDetail(taskId);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [taskId, getTaskDetail]);
  
  return (
    <div>
      {/* Task content here */}
    </div>
  );
}
```

#### Example: Subscribe to Bid Updates

```javascript
function MyBidsPage() {
  const { getMyBids, myBids } = useBids();
  
  useEffect(() => {
    // Fetch initial bids
    getMyBids();
    
    // Subscribe to bid status changes
    const unsubBidStatus = realtimeService.subscribe('bid_status_changed', (data) => {
      getMyBids(); // Refetch when status changes
    });
    
    // Subscribe to new bids
    const unsubNewBid = realtimeService.subscribe('bid_placed', (data) => {
      getMyBids(); // Refetch when new bid arrives
    });
    
    // Cleanup all subscriptions
    return () => {
      unsubBidStatus();
      unsubNewBid();
    };
  }, [getMyBids]);
  
  return (
    <div>
      {myBids.map(bid => <BidCard key={bid._id} bid={bid} />)}
    </div>
  );
}
```

### 2. Available Subscription Methods

```javascript
import realtimeService from '../services/realtimeService';

// Generic subscription
realtimeService.subscribe(eventType, callback, optionalId);

// Task subscriptions
realtimeService.subscribeToTaskUpdates(taskId, callback);
realtimeService.subscribeToUserTasks(callback); // Your tasks

// Bid subscriptions
realtimeService.subscribeToBidUpdates(taskId, callback);
realtimeService.subscribeToBidStatusChanges(bidId, callback);
realtimeService.subscribeToUserBids(callback);

// Message subscriptions
realtimeService.subscribeToMessages(taskId, callback);

// Review subscriptions
realtimeService.subscribeToReviews(taskId, callback);
```

### 3. All Supported Real-time Events

```javascript
// Task Events
'task_updated'        // When task details change
'task_status_changed' // When task status changes

// Bid Events
'bid_placed'          // When new bid is created
'bid_updated'         // When bid details change
'bid_status_changed'  // When bid status changes (accepted/rejected)

// Message Events
'message_received'    // When new message arrives

// Review Events
'review_added'        // When new review is submitted

// Notification Events
'notification'        // Generic notification
```

### 4. Redux Action Examples

#### Importing Redux actions for real-time updates:

```javascript
import {
  updateTaskDetailFromSocket,
  updateTaskInList,
  refreshTaskDetail
} from '../store/slices/tasksSlice';

import {
  updateBidFromSocket,
  addBidToTask
} from '../store/slices/bidsSlice';
```

#### Dispatching optimistic updates:

```javascript
import { useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();
  
  // Optimistically update Redux without fetching
  const handleBidStatusChange = (bidId, newStatus) => {
    // Update Redux immediately
    dispatch(updateBidFromSocket({
      _id: bidId,
      status: newStatus
    }));
  };
  
  return (
    // Component JSX
  );
}
```

### 5. Event Listener Pattern

#### How events flow through the system:

```javascript
// 1. Backend sends socket event
// Backend: io.to(userId).emit('notification', { type: 'new_bid', ... })

// 2. Frontend socket service receives it
// socket.js: socket.on('notification', (notification) => { ... })

// 3. Socket service emits real-time event
socket.emit('bid_placed', {
  taskId: notification.data.taskId,
  bidId: notification.data.bidId,
  amount: notification.data.amount
});

// 4. Real-time service broadcasts to subscribers
// realtimeService triggers all callbacks for 'bid_placed'

// 5. Component callback is called
realtimeService.subscribe('bid_placed', (data) => {
  console.log('New bid:', data);
  refetchBids(); // Update UI
});
```

### 6. Best Practices

#### ✅ DO:
```javascript
// Setup cleanup function
useEffect(() => {
  const unsub = realtimeService.subscribe('event', callback);
  return () => unsub(); // Always cleanup!
}, []);

// Refetch data instead of updating manually
realtimeService.subscribe('bid_placed', () => {
  fetchBids(); // Fetches fresh data from server
});

// Use appropriate subscription method
realtimeService.subscribeToTaskUpdates(taskId, callback);
```

#### ❌ DON'T:
```javascript
// Don't forget cleanup
useEffect(() => {
  const unsub = realtimeService.subscribe('event', callback);
  // Missing return () => unsub();
}, []);

// Don't manually update state without validation
realtimeService.subscribe('bid_placed', (data) => {
  setMyBids([...myBids, data]); // Risk: duplicate or stale data
});

// Don't create subscriptions in render
function Component() {
  realtimeService.subscribe('event', callback); // Will subscribe every render!
}
```

### 7. Complete Example: Task List with Real-time Updates

```javascript
import { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import realtimeService from '../services/realtimeService';

export default function TasksList() {
  const { getCustomerTasks, customerTasks, customerTasksLoading } = useTasks();
  const [filterStatus, setFilterStatus] = useState('open');
  
  // Initial load
  useEffect(() => {
    loadTasks();
  }, [filterStatus]);
  
  // Real-time updates
  useEffect(() => {
    // Listen for any task status changes
    const unsubscribe = realtimeService.subscribeToUserTasks((data) => {
      // Reload tasks when status changes
      loadTasks();
    });
    
    return () => unsubscribe();
  }, [filterStatus]);
  
  const loadTasks = async () => {
    try {
      await getCustomerTasks({ status: filterStatus });
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };
  
  if (customerTasksLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>My Tasks</h1>
      
      <div className="filters">
        <button 
          onClick={() => setFilterStatus('open')}
          className={filterStatus === 'open' ? 'active' : ''}
        >
          Open Tasks
        </button>
        <button 
          onClick={() => setFilterStatus('inProgress')}
          className={filterStatus === 'inProgress' ? 'active' : ''}
        >
          In Progress
        </button>
      </div>
      
      <div className="task-list">
        {customerTasks.map(task => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

### 8. Testing Real-time Updates

#### Test Script:
```javascript
// 1. Open browser console on the page
// 2. Subscribe to an event manually
const testUnsub = realtimeService.subscribe('bid_placed', (data) => {
  console.log('✅ Real-time update received:', data);
  console.log('Event data:', data);
});

// 3. In another window, trigger the event (e.g., place a bid)
// 4. You should see the log in the console

// 5. Clean up
testUnsub();
```

#### Check Active Subscriptions:
```javascript
// In browser console
console.log('Active subscriptions:', realtimeService.subscriptions);
console.log('Event callbacks:', realtimeService.callbacks);
```

### 9. Common Issues & Solutions

#### Issue: Subscription not firing
```javascript
// Check if socket is connected
const socket = socketService.getSocket();
console.log('Socket connected:', socket?.connected);

// Check subscription was added
console.log(realtimeService.subscriptions);

// Verify event name matches
// Use one of the predefined methods for correct event names
```

#### Issue: Multiple refetches
```javascript
// Make sure cleanup function is called
useEffect(() => {
  const unsub = realtimeService.subscribe('event', callback);
  return () => unsub(); // This is essential!
}, []); // Include all dependencies
```

#### Issue: Stale data
```javascript
// Always refetch from server, don't manually update
const unsub = realtimeService.subscribe('bid_placed', () => {
  // Good: Refetch from server
  getMyBids();
  
  // Bad: Manually update
  // setMyBids([...myBids, newBid]); // Can get out of sync!
});
```

### 10. Performance Optimization Tips

#### Debounce rapid updates:
```javascript
import { useCallback } from 'react';

function MyComponent() {
  const handleUpdate = useCallback(() => {
    // This callback will only be created once
    loadData();
  }, []);
  
  useEffect(() => {
    // Subscribe with debounced callback
    const unsub = realtimeService.subscribe('event', () => {
      handleUpdate();
    });
    return () => unsub();
  }, [handleUpdate]);
}
```

#### Selective subscriptions:
```javascript
// Only subscribe when needed
useEffect(() => {
  // Only if task detail page is visible
  if (taskId) {
    const unsub = realtimeService.subscribeToTaskUpdates(taskId, () => {
      getTaskDetail(taskId);
    });
    return () => unsub();
  }
}, [taskId]);
```

---

**Quick Reference Card:**
- 📡 **Subscribe:** `realtimeService.subscribe(eventType, callback)`
- 🔄 **Refetch:** `getTaskDetail(id)` or similar hook methods
- 🧹 **Cleanup:** `return () => unsubscribe()` in useEffect
- 📱 **Test:** Open DevTools → Network → WS to see events
- 🐛 **Debug:** `console.log(realtimeService.subscriptions)`
