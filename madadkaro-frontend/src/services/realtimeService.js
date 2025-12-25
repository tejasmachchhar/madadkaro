/**
 * Real-time Service
 * Manages subscriptions to real-time updates for tasks, bids, messages, and reviews
 * Provides a centralized way to subscribe to specific events and automatically
 * triggers Redux actions to update the state
 */

import socketService from './socket';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map(); // Store active subscriptions
    this.callbacks = new Map(); // Store registered callbacks
    this.socket = null;
    this.setupListeners = new Set(); // Track which event types have listeners setup
  }

  /**
   * Initialize the socket connection
   * Should be called after socket is connected
   */
  initializeSocket(socket) {
    this.socket = socket;
    console.log('[RealtimeService] Socket initialized');
  }

  /**
   * Register a callback for a specific event type
   * @param {string} eventType - Type of event (task_updated, bid_placed, etc.)
   * @param {function} callback - Callback function to execute
   * @param {string} id - Optional ID to identify this subscription
   * @returns {function} Unsubscribe function
   */
  subscribe(eventType, callback, id = null) {
    const socket = this.socket || socketService.getSocket();
    if (!socket) {
      console.warn(`[RealtimeService] Socket not initialized when subscribing to ${eventType}`);
      return () => {};
    }

    const subscriptionId = id || `${eventType}-${Date.now()}`;
    console.log(`[RealtimeService] Subscribing to "${eventType}" with id "${subscriptionId}"`);

    // Store the callback
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Map());
    }
    this.callbacks.get(eventType).set(subscriptionId, callback);

    // If this is the first subscription to this event type, set up the socket listener
    if (!this.setupListeners.has(eventType)) {
      console.log(`[RealtimeService] First subscription to "${eventType}", setting up socket listener`);
      this._setupSocketListener(eventType, socket);
      this.setupListeners.add(eventType);
    } else {
      console.log(`[RealtimeService] Listener already setup for "${eventType}"`);
    }

    // Store subscription metadata
    if (!this.subscriptions.has(subscriptionId)) {
      this.subscriptions.set(subscriptionId, {
        eventType,
        createdAt: Date.now()
      });
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, subscriptionId);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventType - Type of event
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribe(eventType, subscriptionId) {
    if (this.callbacks.has(eventType)) {
      this.callbacks.get(eventType).delete(subscriptionId);
      
      // If no more callbacks for this event type, clean up
      if (this.callbacks.get(eventType).size === 0) {
        this.callbacks.delete(eventType);
      }
    }

    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Set up a socket listener for an event type
   * @param {string} eventType - Type of event
   * @param {Object} socket - Socket connection
   * @private
   */
  _setupSocketListener(eventType, socket) {
    if (!socket) {
      console.warn('[RealtimeService] Socket not available for listener setup for eventType:', eventType);
      return;
    }

    // Map event types to socket events from notifications
    const socketEventMap = {
      'task_updated': 'notification',
      'task_status_changed': 'notification',
      'bid_placed': 'notification',
      'bid_updated': 'notification',
      'bid_status_changed': 'notification',
      'message_received': 'new_message',
      'review_added': 'notification',
      'review_received': 'notification',
      'notification': 'notification'
    };

    const socketEvent = socketEventMap[eventType] || 'notification';

    console.log(`[RealtimeService] Setting up listener for eventType: ${eventType}, socketEvent: ${socketEvent}`);

    // For notification events, filter by type
    socket.on(socketEvent, (data) => {
      console.log(`[RealtimeService] Real-time event received on ${socketEvent}:`, data);

      // Check if this notification matches the event type we're listening for
      let shouldTrigger = false;

      if (socketEvent === 'notification') {
        // Map notification types to our event types
        const notificationToEventMap = {
          'task_started': 'task_status_changed',
          'completion_requested': 'task_status_changed',
          'completion_confirmed': 'task_status_changed',
          'completion_rejected': 'task_status_changed',
          'task_cancelled': 'task_status_changed',
          'task_assigned': 'task_status_changed',
          'new_bid': 'bid_placed',
          'bid_accepted': 'bid_status_changed',
          'bid_rejected': 'bid_status_changed',
          'bid_updated': 'bid_updated',
          'review_received': 'review_added'
        };

        const mappedEvent = notificationToEventMap[data.type];
        shouldTrigger = mappedEvent === eventType;
        console.log(`[RealtimeService] Mapped notification type "${data.type}" to event "${mappedEvent}", shouldTrigger for "${eventType}":`, shouldTrigger);
      } else if (socketEvent === 'new_message') {
        shouldTrigger = eventType === 'message_received';
      } else {
        shouldTrigger = socketEvent === eventType;
      }

      if (shouldTrigger) {
        console.log(`[RealtimeService] Triggering callbacks for event type: ${eventType} with data:`, data);
        console.log(`[RealtimeService] Calling _triggerCallbacks with eventType: ${eventType}`);
        this._triggerCallbacks(eventType, data);
      } else {
        console.log(`[RealtimeService] NOT triggering callbacks for event type: ${eventType} (shouldTrigger: ${shouldTrigger})`);
      }
    });
  }

  /**
   * Trigger all callbacks for an event type
   * @param {string} eventType - Type of event
   * @param {any} data - Event data
   * @private
   */
  _triggerCallbacks(eventType, data) {
    if (this.callbacks.has(eventType)) {
      this.callbacks.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in callback for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to task updates
   * @param {string} taskId - Task ID to watch
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToTaskUpdates(taskId, callback) {
    return this.subscribe('task_status_changed', callback, `task-${taskId}`);
  }

  /**
   * Subscribe to bid updates for a specific task
   * @param {string} taskId - Task ID to watch
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToBidUpdates(taskId, callback) {
    return this.subscribe('bid_placed', callback, `task-bids-${taskId}`);
  }

  /**
   * Subscribe to bid status changes
   * @param {string} bidId - Bid ID to watch
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToBidStatusChanges(bidId, callback) {
    return this.subscribe('bid_status_changed', callback, `bid-${bidId}`);
  }

  /**
   * Subscribe to user's task list updates
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToUserTasks(callback) {
    return this.subscribe('task_status_changed', callback, 'user-tasks');
  }

  /**
   * Subscribe to user's bid list updates
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToUserBids(callback) {
    return this.subscribe('bid_updated', callback, 'user-bids');
  }

  /**
   * Subscribe to messages
   * @param {string} taskId - Task ID
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToMessages(taskId, callback) {
    return this.subscribe('message_received', callback, `task-messages-${taskId}`);
  }

  /**
   * Subscribe to reviews
   * @param {string} taskId - Task ID
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToReviews(taskId, callback) {
    return this.subscribe('review_added', callback, `task-reviews-${taskId}`);
  }

  /**
   * Subscribe to review notifications for taskers
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeToReviewNotifications(callback) {
    return this.subscribe('review_added', callback, 'review-notifications');
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.subscriptions.clear();
    this.callbacks.clear();
    this.setupListeners.clear();
  }
}

// Export singleton instance
export default new RealtimeService();
