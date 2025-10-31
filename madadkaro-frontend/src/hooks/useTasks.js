import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  fetchCustomerTasks,
  fetchAvailableTasks,
  fetchTaskDetail,
  createTask,
  updateTask,
  requestTaskCompletion,
  confirmTaskCompletion,
  rejectTaskCompletion,
  addTaskerFeedback,
  selectCustomerTasks,
  selectCustomerTasksLoading,
  selectCustomerTasksError,
  selectAvailableTasks,
  selectAvailableTasksLoading,
  selectAvailableTasksError,
  selectTaskDetail,
  selectTaskDetailLoading,
  selectTaskDetailError,
  selectCategories,
  resetTaskErrors,
  selectAvailableTasksByCategory,
} from '../store/slices/tasksSlice';

/**
 * Custom hook for tasks operations
 * @returns {Object} Tasks methods and state
 */
export const useTasks = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const customerTasks = useSelector(selectCustomerTasks);
  const customerTasksLoading = useSelector(selectCustomerTasksLoading);
  const customerTasksError = useSelector(selectCustomerTasksError);
  
  const availableTasks = useSelector(selectAvailableTasks);
  const availableTasksLoading = useSelector(selectAvailableTasksLoading);
  const availableTasksError = useSelector(selectAvailableTasksError);
  
  const taskDetail = useSelector(selectTaskDetail);
  const taskDetailLoading = useSelector(selectTaskDetailLoading);
  const taskDetailError = useSelector(selectTaskDetailError);
  
  const categories = useSelector(selectCategories);
  
  // Handle errors
  useEffect(() => {
    if (availableTasksError) {
      console.error('Error fetching available tasks:', availableTasksError);
      toast.error(availableTasksError || 'Failed to load available tasks. Please try again later.');
      dispatch(resetTaskErrors());
    }
    
    if (customerTasksError) {
      console.error('Error fetching customer tasks:', customerTasksError);
      toast.error(customerTasksError || 'Failed to load your tasks. Please try again later.');
      dispatch(resetTaskErrors());
    }

    if (taskDetailError && taskDetailError !== 'Request aborted') {
      console.error('Error fetching task details:', taskDetailError);
      toast.error(taskDetailError || 'Failed to load task details. Please try again later.');
      dispatch(resetTaskErrors());
    }
  }, [availableTasksError, customerTasksError, taskDetailError, dispatch]);
  
  // Task actions
  const getCustomerTasks = useCallback(
    async (params) => {
      try {
        await dispatch(fetchCustomerTasks(params)).unwrap();
      } catch (error) {
        console.error('Error in getCustomerTasks:', error);
        // Error already handled in the effect
      }
    },
    [dispatch]
  );
  
  const getAvailableTasks = useCallback(
    async (params) => {
      try {
        await dispatch(fetchAvailableTasks(params)).unwrap();
      } catch (error) {
        console.error('Error in getAvailableTasks:', error);
        // Error already handled in the effect
      }
    },
    [dispatch]
  );
  
  const getTaskDetail = useCallback(
    async (taskId, signal) => {
      try {
        console.log('Fetching task detail for taskId:', taskId);
        const result = await dispatch(fetchTaskDetail({ taskId, signal })).unwrap();
        console.log('Task detail fetched successfully:', result);
        
        // Log specific information about bids to help with debugging
        if (result) {
          console.log('Task has bids array:', !!result.bids);
          if (result.bids) {
            console.log('Number of bids:', result.bids.length);
          }
          console.log('Task has userBid property:', !!result.userBid);
        }
        
        return result;
      } catch (error) {
        if (error === 'Request aborted' || error.name === 'CanceledError' || error.name === 'AbortError') {
          throw error;
        }
        console.error('Error in getTaskDetail:', error);
        throw error; // Re-throw to allow caller to handle if needed
      }
    },
    [dispatch]
  );
  
  const addTask = useCallback(
    (taskData) => dispatch(createTask(taskData)),
    [dispatch]
  );
  
  const editTask = useCallback(
    (taskId, taskData) => dispatch(updateTask({ taskId, taskData })),
    [dispatch]
  );
  
  const requestCompletion = useCallback(
    (taskId, completionNote) => dispatch(requestTaskCompletion({ taskId, completionNote })),
    [dispatch]
  );
  
  const confirmCompletion = useCallback(
    (taskId, customerFeedback) => dispatch(confirmTaskCompletion({ taskId, customerFeedback })),
    [dispatch]
  );
  
  const rejectCompletion = useCallback(
    (taskId, rejectionReason) => dispatch(rejectTaskCompletion({ taskId, rejectionReason })),
    [dispatch]
  );
  
  const addFeedback = useCallback(
    (taskId, taskerFeedback) => dispatch(addTaskerFeedback({ taskId, taskerFeedback })),
    [dispatch]
  );
  
  const getTasksByCategory = useCallback(
    (category) => useSelector((state) => selectAvailableTasksByCategory(state, category)),
    []
  );
  
  return {
    // State
    customerTasks: Array.isArray(customerTasks) ? customerTasks : [],
    customerTasksLoading,
    customerTasksError,
    availableTasks: Array.isArray(availableTasks) ? availableTasks : [],
    availableTasksLoading,
    availableTasksError,
    taskDetail,
    taskDetailLoading,
    taskDetailError,
    categories,
    
    // Actions
    getCustomerTasks,
    getAvailableTasks,
    getTaskDetail,
    addTask,
    editTask,
    getTasksByCategory,
    requestCompletion,
    confirmCompletion,
    rejectCompletion,
    addFeedback,
  };
};