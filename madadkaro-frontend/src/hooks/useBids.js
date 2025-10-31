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
  resetBidErrors,
} from '../store/slices/bidsSlice';

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
    
    // Actions
    getMyBids,
    getBidDetail,
    getTaskBids,
    addBid,
    editBid,
    changeBidStatus,
  };
}; 