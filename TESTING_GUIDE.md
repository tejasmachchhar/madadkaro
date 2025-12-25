# Real-Time Update Testing Guide

## Overview
This guide helps you verify that the complete real-time notification and page update system is working correctly after the recent fixes.

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- At least 2 test user accounts (one customer, one tasker)
- Open DevTools (F12) to monitor console for debug messages

## Test Scenarios

### Test 1: Task Start Notification
**Objective:** Verify that when a tasker starts a task, the customer receives a real-time notification and the page updates.

**Steps:**
1. **Backend Verification:**
   - Backend console should show: `[Socket.io] Customer {customerId} connected with socket {socketId}`
   - When tasker clicks "Start Task", should see: `[Socket.io] Emitting task_started to socket {socketId}`

2. **Customer Browser:**
   - Open DevTools Console
   - Watch for message: `Real-time event subscribed: task_status_changed` (on page load)
   - As tasker, click "Start Task" button
   - You should see: `Real-time event received: task_status_changed` in console
   - Task status should change from "posted" to "in_progress" **without page refresh**
   - Optional: Notification toast should appear

**Expected Results:**
- ✅ Customer page updates instantly
- ✅ No page refresh required
- ✅ Task status changes from "posted" to "in_progress"

**Debug Info to Check:**
```javascript
// In browser console (Customer side):
// Look for these messages:
"Real-time event subscribed: task_status_changed"
"Real-time event received: task_status_changed"

// Check Redux state (if Redux DevTools installed):
// tasks.items[taskId].status should change to "in_progress"
```

---

### Test 2: Completion Request Notification
**Objective:** Verify that when a tasker requests task completion, the customer receives notification.

**Steps:**
1. Have an "in_progress" task assigned to a tasker
2. Tasker opens TaskCompletion component and clicks "Request Completion"
3. Customer should see:
   - Real-time notification in console: `Real-time event received: task_completion_requested`
   - Task status changes to "completion_requested"
   - Buttons appear for customer to confirm or reject completion

**Expected Results:**
- ✅ Notification arrives without page refresh
- ✅ Task UI updates to show completion request state
- ✅ Customer can accept/reject without reload

---

### Test 3: New Bid Notification
**Objective:** Verify that when a tasker bids on a task, the customer gets real-time notification.

**Steps:**
1. Customer posts a task
2. Switch to tasker account
3. Find the task and click "Place Bid"
4. Fill in bid details and submit
5. Switch back to customer
6. Should see:
   - Console message: `Real-time event received: bid_placed`
   - New bid appears in bids list
   - No page refresh needed

**Expected Results:**
- ✅ Bid appears instantly on customer's page
- ✅ Bid count increases in real-time
- ✅ Customer can view bid details immediately

---

### Test 4: Bid Accepted Notification
**Objective:** Verify that when a customer accepts a bid, the tasker gets real-time update.

**Steps:**
1. Tasker has placed bid on a task
2. Customer views the bid and clicks "Accept Bid"
3. Switch to tasker's browser window
4. Tasker should see:
   - Console: `Real-time event received: bid_status_changed`
   - Task assigned to tasker instantly
   - No page refresh needed

**Expected Results:**
- ✅ Tasker sees bid acceptance immediately
- ✅ Task appears in tasker's "My Tasks" without reload
- ✅ Status updates to "in_progress" if auto-start is enabled

---

## Monitoring Real-Time Flow

### Browser Console Messages
Add these log points in your browser console to track real-time events:

```javascript
// Listen to Redux state changes (if Redux Devtools available)
// Watch "tasks" and "bids" sections for instant updates

// Check socket connection
window.socketService?.getSocket()?.connected // Should be true

// Check if realtimeService is initialized
window.realtimeService?.isInitialized // Should be true (if exposed)
```

### Backend Console Messages
Watch for these patterns in terminal running Node.js:

```
[Socket.io] User {userId} connected with socket {socketId}
[Socket.io] Emitting {eventType} to socket {socketId}
[Socket.io] Error emitting to socket: {error} // Should NOT appear during normal flow
```

### Network Tab
- Open DevTools → Network → WS (WebSocket)
- Should see persistent WebSocket connection to `http://localhost:5000/socket.io/`
- When events occur, should see messages in the WS connection (not visible as separate requests)

---

## Common Issues & Solutions

### Issue: No Real-Time Updates
**Symptoms:** Changes require page refresh

**Debugging Steps:**
1. Check browser console for: `Real-time event received:` messages
2. If not appearing:
   - Check if socket is connected: `socketService.getSocket().connected`
   - Check AuthContext initialization happened: Look for socket connection logs
   - Verify backend is emitting correctly (check backend console)

**Solution:**
- Restart both backend and frontend servers
- Check that token is valid and stored in localStorage
- Verify websocket connection is established (Network tab)

### Issue: Buttons Not Responding
**Symptoms:** Click "Start Task" / "Place Bid" but nothing happens

**Debugging Steps:**
1. Open browser console
2. Click the button and look for API errors
3. Check if:
   - User role is correct (customer vs tasker)
   - Task status is correct for that action
   - Button condition logic is correct

**Solution:**
- Check TaskDetailPage.jsx line 330 for "Start Task" button logic
- Verify useAuth() hook returns correct user data
- Check network requests in Network tab for API call failures

### Issue: Socket Connection Never Established
**Symptoms:** Socket stays disconnected, WebSocket shows errors

**Debugging Steps:**
1. Check browser console for socket connection errors
2. Verify backend is running and socket.io is initialized
3. Check CORS settings if on different domains
4. Verify token is valid (check network request headers)

**Solution:**
- Restart backend server (may not be accepting connections)
- Clear browser cache and reload
- Check firebaseConfig token generation (if Firebase auth)

---

## Performance Checks

### Expected Performance
- Real-time update latency: < 500ms
- Socket connection establishment: < 2 seconds
- Page re-render time: < 100ms

### Memory Usage
- WebSocket should use minimal memory
- Redux subscriptions should not cause memory leaks
- Check DevTools → Memory for unusual growth during long sessions

---

## Test Results Template

Use this to document your testing:

```markdown
## Real-Time Update Testing Results

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** Development / Production

### Test 1: Task Start Notification
- [ ] Backend emits event
- [ ] Customer receives notification
- [ ] Page updates without refresh
- [ ] Notes: ___________

### Test 2: Completion Request
- [ ] Tasker can request completion
- [ ] Customer receives notification
- [ ] Can confirm/reject without refresh
- [ ] Notes: ___________

### Test 3: New Bid Notification
- [ ] Tasker places bid
- [ ] Customer receives notification
- [ ] Bid appears instantly
- [ ] Notes: ___________

### Test 4: Bid Accepted Notification
- [ ] Customer accepts bid
- [ ] Tasker receives notification
- [ ] Task appears without refresh
- [ ] Notes: ___________

### Overall Status
- ✅ All tests passed
- 🟡 Some tests passed: [which ones failed]
- ❌ System not working

### Issues Found
1. [Issue description]
2. [Issue description]
```

---

## Code Changes Summary

The following fixes were applied to enable real-time updates:

### Backend Fixes (taskController.js)
- Fixed socket notification sending to use Map.get() instead of bracket notation
- Ensured customer ID is converted to string for Map lookup
- Added error handling for socket emission failures

### Frontend Fixes (realtimeService.js)
- Added socket parameter acceptance in _setupSocketListener()
- Fixed notification type filtering to map backend events to frontend events
- Ensured callbacks are only triggered for matching event types

### Frontend Initialization (AuthContext.jsx)
- Added realtimeService import
- Call realtimeService.initializeSocket(socket) after socket is created
- Ensures socket listeners are attached immediately on app load

---

## Next Steps

If all tests pass:
1. ✅ Real-time update system is working
2. ✅ Notifications are being delivered
3. ✅ Pages update without manual refresh
4. Deploy to production

If tests fail:
1. Check specific test scenario for error details
2. Review console logs (browser and backend)
3. Verify all code changes were applied correctly
4. Restart both servers if needed
5. Check network connectivity between frontend and backend
