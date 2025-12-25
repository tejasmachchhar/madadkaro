import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  fetchMyBids,
  fetchBidDetail,
  fetchTaskBids,
  createBid,
  updateBid,
  updateBidStatus,
  selectMyBids,
  selectMyBidsLoading,
  selectMyBidsError,
  selectBidDetail,
  selectBidDetailLoading,
  selectBidDetailError,
  selectTaskBids,
  selectTaskBidsLoading,
  selectTaskBidsError,
  selectActiveBids,
  selectPendingBids,
  selectRejectedBids,
  resetBidErrors,
  updateBidFromSocket,
  updateTaskInBids,
  addBidToTask,
} from '../store/slices/bidsSlice';
import realtimeService from '../services/realtimeService';

/**
 * Custom hook for bids operations
 * @returns {Object} Bids methods and state
 */
export const useBids = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const myBids = useSelector(selectMyBids);
  const myBidsLoading = useSelector(selectMyBidsLoading);
  const myBidsError = useSelector(selectMyBidsError);
  
  const bidDetail = useSelector(selectBidDetail);
  const bidDetailLoading = useSelector(selectBidDetailLoading);
  const bidDetailError = useSelector(selectBidDetailError);
  
  const taskBids = useSelector(selectTaskBids);
  const taskBidsLoading = useSelector(selectTaskBidsLoading);
  const taskBidsError = useSelector(selectTaskBidsError);
  
  const activeBids = useSelector(selectActiveBids);
  const pendingBids = useSelector(selectPendingBids);
  const rejectedBids = useSelector(selectRejectedBids);
  
  // Handle errors
  useEffect(() => {
    if (myBidsError) {
      console.error('Error fetching my bids:', myBidsError);
      toast.error(myBidsError || 'Failed to load your bids. Please try again later.');
      dispatch(resetBidErrors());
    }
  }, [myBidsError, dispatch]);
  
  // Bid actions
  const getMyBids = useCallback(
    async (params) => {
      try {
        await dispatch(fetchMyBids(params)).unwrap();
      } catch (error) {
        console.error('Error in getMyBids:', error);
        // Error already handled in the effect
      }
    },
    [dispatch]
  );
  
  const getBidDetail = useCallback(
    (bidId) => dispatch(fetchBidDetail(bidId)),
    [dispatch]
  );
  
  const getTaskBids = useCallback(
    (taskId) => dispatch(fetchTaskBids(taskId)),
    [dispatch]
  );
  
  const addBid = useCallback(
    (taskId, bidData) => dispatch(createBid({ taskId, bidData })),
    [dispatch]
  );
  
  const editBid = useCallback(
    (bidId, bidData) => dispatch(updateBid({ bidId, bidData })),
    [dispatch]
  );
  
  const changeBidStatus = useCallback(
    (bidId, status) => dispatch(updateBidStatus({ bidId, status })),
    [dispatch]
  );
  
  // Set up real-time listeners for bid updates
  useEffect(() => {
    const unsubscribers = [];
    
    // Listen for bid status changes
    const unsubBidStatus = realtimeService.subscribe('bid_status_changed', (data) => {
      console.log('[useBids] Received bid_status_changed event:', data);
      if (data.bidId) {
        console.log('[useBids] Updating bid status for bidId:', data.bidId, 'to status:', data.status);
        // Dispatch the update to Redux with all available data
        const updateData = { _id: data.bidId, status: data.status };
        if (data.amount) updateData.amount = data.amount;
        if (data.taskTitle) updateData.taskTitle = data.taskTitle;
        dispatch(updateBidFromSocket(updateData));
        console.log('[useBids] Dispatched updateBidFromSocket with:', updateData);
      } else {
        console.log('[useBids] No bidId in bid_status_changed event data');
      }
    });
    unsubscribers.push(unsubBidStatus);

    // Listen for task status changes that might affect bids
    const unsubTaskStatus = realtimeService.subscribe('task_status_changed', (data) => {
      console.log('[useBids] Received task_status_changed event:', data);
      if (data.taskId) {
        console.log('[useBids] Current myBids count:', myBids.length);
        console.log('[useBids] Bids with matching taskId:', myBids.filter(bid => bid.task?._id === data.taskId).length);

        // Update task status in existing bids immediately
        console.log('[useBids] Updating task status for taskId:', data.taskId, 'to status:', data.status);
        dispatch(updateTaskInBids({ taskId: data.taskId, status: data.status }));

        // Refetch bids after a delay to get server-confirmed data
        console.log('[useBids] Scheduling bids refetch after delay');
        setTimeout(() => {
          getMyBids();
        }, 3000); // Longer delay to ensure server update is complete
      }
    });
    unsubscribers.push(unsubTaskStatus);
    
    // Listen for new bids on tasks
    const unsubNewBid = realtimeService.subscribe('bid_placed', (data) => {
      console.log('[useBids] Received bid_placed event:', data);
      if (data.taskId && taskBids.length > 0) {
        console.log('[useBids] Found task in taskBids, refetching bids for taskId:', data.taskId);
        const task = taskBids.find(t => t._id === data.taskId);
        if (task) {
          // Re-fetch task bids to get the new bid
          dispatch(fetchTaskBids(data.taskId));
        }
      } else {
        console.log('[useBids] No matching task found in taskBids or no taskId');
      }
    });
    unsubscribers.push(unsubNewBid);
    
    // Listen for bid updates
    const unsubBidUpdate = realtimeService.subscribe('bid_updated', (data) => {
      if (data.bidId) {
        dispatch(fetchBidDetail(data.bidId));
      }
    });
    unsubscribers.push(unsubBidUpdate);
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [taskBids, dispatch]);
  
  return {
    // State
    myBids: Array.isArray(myBids) ? myBids : [],
    myBidsLoading,
    myBidsError,
    bidDetail,
    bidDetailLoading,
    bidDetailError,
    taskBids: Array.isArray(taskBids) ? taskBids : [],
    taskBidsLoading,
    taskBidsError,
    activeBids: Array.isArray(activeBids) ? activeBids : [],
    pendingBids: Array.isArray(pendingBids) ? pendingBids : [],
    rejectedBids: Array.isArray(rejectedBids) ? rejectedBids : [],
    
    // Actions
    getMyBids,
    getBidDetail,
    getTaskBids,
    addBid,
    editBid,
    changeBidStatus,
  };
}; 