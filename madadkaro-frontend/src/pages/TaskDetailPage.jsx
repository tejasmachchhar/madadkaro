import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useBids } from '../hooks/useBids';
import { toast } from 'react-toastify';
import ChatInterface from '../components/ChatInterface';
import TaskCompletion from '../components/TaskCompletion';
import api from '../services/api';
import realtimeService from '../services/realtimeService';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isTasker, isCustomer } = useAuth();
  const { taskDetail, taskDetailLoading, getTaskDetail } = useTasks();
  
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({
    amount: '',
    message: '',
    estimatedDays: ''
  });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [userBid, setUserBid] = useState({});
  const [showChat, setShowChat] = useState(false);

  const taskStatus = useMemo(() => taskDetail?.status || 'unknown', [taskDetail?.status]);
  
  const isTaskOpen = useMemo(() => taskStatus === 'open', [taskStatus]);
  
  const canSubmitBid = useMemo(() => {
    return isTasker && 
           isTaskOpen && 
           currentUser?._id !== taskDetail?.customer?._id;
  }, [isTasker, isTaskOpen, currentUser?._id, taskDetail?.customer?._id]);

  const canManageTask = useMemo(() => {
    return currentUser?._id === taskDetail?.customer?._id || 
           (taskDetail?.acceptedBid?.tasker === currentUser?._id);
  }, [currentUser?._id, taskDetail?.customer?._id, taskDetail?.acceptedBid?.tasker]);
  
  // Check if user is the customer who created the task or admin
  const isTaskOwner = useMemo(() => {
    return currentUser && taskDetail?.customer && 
      currentUser._id === taskDetail.customer._id;
  }, [currentUser, taskDetail]);
  
  const isAdmin = useMemo(() => {
    return currentUser?.role === 'admin';
  }, [currentUser]);

  const canSeeBids = useMemo(() => {
    return isTaskOwner || isAdmin;
  }, [isTaskOwner, isAdmin]);
  
  // Debug log for bids
  useEffect(() => {
    if (taskDetail) {
      console.log('Task detail loaded:', taskDetail);
      console.log('Task has bids array:', !!taskDetail.bids);
      if (taskDetail.bids) {
        console.log('Number of bids:', taskDetail.bids.length);
      }
      console.log('Can see bids:', canSeeBids);
    }
  }, [taskDetail, canSeeBids]);

  // Reset bid form when closing
  useEffect(() => {
    if (!showBidForm) {
      setBidData({
        amount: '',
        message: '',
        estimatedDays: ''
      });
    }
  }, [showBidForm]);

  // Check user's existing bid - consolidated approach
  useEffect(() => {
    if (!currentUser || !isTasker || !taskDetail) return;
    
    // First check if there's a userBid property directly on taskDetail
    if (taskDetail.userBid && taskDetail.userBid.tasker === currentUser._id) {
      setUserBid(taskDetail.userBid);
      if (showBidForm) {
        setBidData({
          amount: taskDetail.userBid.amount.toString(),
          message: taskDetail.userBid.message,
          estimatedDays: taskDetail.userBid.estimatedDays?.toString() || ''
        });
      }
      return; // Exit early if we found the bid this way
    }
    
    // If no userBid property or it doesn't match, check the bids array
    if (taskDetail.bids && taskDetail.bids.length > 0) {
      const userBidIndex = taskDetail.bids.findIndex(
        bid => bid.tasker._id === currentUser._id
      );
      
      if (userBidIndex !== -1) {
        const foundBid = taskDetail.bids[userBidIndex];
        setUserBid(foundBid);
        
        if (showBidForm) {
          setBidData({
            amount: foundBid.amount.toString(),
            message: foundBid.message,
            estimatedDays: foundBid.estimatedDays?.toString() || ''
          });
        }
        return;
      }
    }
    
    // If we get here, no bid was found
    setUserBid(null);
  }, [currentUser, isTasker, taskDetail, showBidForm]);

  useEffect(() => {
    if (location.state?.editBid && userBid) {
      console.log('Editing bid:', userBid);
      setBidData({
        amount: userBid.amount,
        message: userBid.message,
        estimatedDays: userBid.estimatedDays ? userBid.estimatedDays.toString() : ''
      });
      // setShowBidForm(false);
      console.log('Bid form status:', showBidForm);
      console.log('Bid data after setting:', bidData);
    }
  }, [location.state, userBid]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchTaskDetails = async () => {
      try {
        await getTaskDetail(taskId, signal);
      } catch (error) {
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error === 'Request aborted') return;
        console.error('Error fetching task details:', error);
        toast.error('Failed to fetch task details');
      }
    };

    fetchTaskDetails();

    // Register a callback to refresh task details when socket notifications arrive
    window.refreshTaskDetails = (notificationTaskId) => {
      if (notificationTaskId === taskId) {
        fetchTaskDetails();
      }
    };
    
    // Set up real-time listener for task updates
    const unsubscribeTaskUpdates = realtimeService.subscribeToTaskUpdates(taskId, (data) => {
      fetchTaskDetails();
    });
    
    // Set up real-time listener for bid updates on this task
    const unsubscribeBidUpdates = realtimeService.subscribeToBidUpdates(taskId, (data) => {
      // Refresh task details to get updated bid list
      fetchTaskDetails();
    });

    return () => {
      controller.abort();
      window.refreshTaskDetails = null;
      unsubscribeTaskUpdates();
      unsubscribeBidUpdates();
    };
  }, [taskId, getTaskDetail]);
  

  
  const handleBidChange = useCallback((e) => {
    const { name, value } = e.target;
    setBidData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
  }, []);

  const refreshTaskDetails = useCallback(() => {
    getTaskDetail(taskId);
  }, [taskId, getTaskDetail]);
  
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!bidData.amount || isNaN(bidData.amount) || Number(bidData.amount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    
    if (!bidData.message.trim()) {
      toast.error('Please provide a message');
      return;
    }
    
    setSubmittingBid(true);
    
    try {
      const endpoint = userBid ? `/bids/${userBid._id}` : '/bids';
      const method = userBid ? 'put' : 'post';
      const payload = {
        ...(!userBid && { task: taskId }),
        amount: Number(bidData.amount),
        message: bidData.message.trim(),
        estimatedDays: bidData.estimatedDays ? Number(bidData.estimatedDays) : undefined
      };

      await api[method](endpoint, payload);
      
      toast.success(`Bid ${userBid ? 'updated' : 'submitted'} successfully!`);
      setShowBidForm(false);
      getTaskDetail(taskId);
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to ${userBid ? 'update' : 'submit'} bid`;
      console.error('Error handling bid:', error);
      toast.error(errorMessage);
    } finally {
      setSubmittingBid(false);
    }
  };
  
  const handleAcceptBid = async (bidId) => {
    if (!confirm('Are you sure you want to accept this bid?')) return;
    
    try {
      setSubmittingBid(true);
      await api.put(`/bids/${bidId}/accept`);
      toast.success('Bid accepted successfully!');
      await getTaskDetail(taskId);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept bid';
      console.error('Error accepting bid:', error);
      toast.error(errorMessage);
    } finally {
      setSubmittingBid(false);
    }
  };
  
  const handleRejectBid = async (bidId, reason) => {
    try {
      setSubmittingBid(true);
      await api.put(`/bids/${bidId}/reject`, { reason });
      toast.success('Bid rejected successfully');
      await getTaskDetail(taskId);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject bid';
      console.error('Error rejecting bid:', error);
      toast.error(errorMessage);
    } finally {
      setSubmittingBid(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (!taskDetail && !taskDetailLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-6">The task you're looking for doesn't exist or has been removed.</p>
          <Link to="/tasks" className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const task = taskDetail;
  // Using the memoized values defined earlier
  // const isTaskOwner is already defined above
  // const isAdmin is already defined above
  // const canSeeBids is already defined above
  const isTaskerAssigned = task?.assignedTo && currentUser && task.assignedTo._id === currentUser._id;
  const canBid = isTasker && task?.status === 'open' && !userBid;
  
  // Determine chat partner
  let chatPartnerId = null;
  let chatPartnerName = null;
  
  if (task?.assignedTo && isTaskOwner) {
    chatPartnerId = task.assignedTo._id;
    chatPartnerName = task.assignedTo.name;
  } else if (isTaskerAssigned) {
    chatPartnerId = task.customer._id;
    chatPartnerName = task.customer.name;
  }
  
  // Determine if chat should be available
  const isChatAvailable = task && (task.status === 'assigned' || task.status === 'inProgress' || task.status === 'completionRequested') && 
                          (isTaskOwner || isTaskerAssigned) && 
                          chatPartnerId;
  
  // Determine if task completion section should be shown
  const showTaskCompletion = task && (isTaskOwner && task.status === 'inProgress' ? false : (isTaskOwner || isTaskerAssigned) && 
                             (task.status === 'inProgress' || 
                              task.status === 'completionRequested' || 
                              task.status === 'completed'));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Task Actions - Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center space-x-3">
            {isChatAvailable && (
              <button
                onClick={toggleChat}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {showChat ? 'Hide Chat' : 'Chat'}
              </button>
            )}
            
            {isTaskOwner && task?.status === 'assigned' && (
              <button
                onClick={async () => {
                  try {
                    await api.put(`/tasks/${taskId}/status`, { status: 'inProgress' });
                    // await api.put(`/tasks/${task._id}/start`);
                    toast.success('Task started successfully!');
                    getTaskDetail(taskId);
                  } catch (error) {
                    console.error('Error starting task:', error);
                    toast.error('Failed to start task');
                  }
                }}
                className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition"
              >
                Start Task
              </button>
            )}
            
            {isTaskOwner && task?.status === 'open' && (
              <button
                onClick={() => navigate(`/edit-task/${task?._id}`)}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Edit Task
              </button>
            )}
          </div>
        </div>
        
        {taskDetailLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center text-gray-600">Loading task details...</div>
        ) : (
          <>
            {/* Task Status Banner */}
            <div className={`rounded-lg mb-6 p-4 ${
              task?.status === 'open' ? 'bg-blue-100 text-blue-800' :
              task?.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
              task?.status === 'inProgress' ? 'bg-purple-100 text-purple-800' :
              task?.status === 'completionRequested' ? 'bg-orange-100 text-orange-800' :
              task?.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Status: {task?.status === 'completionRequested' ? 'Completion Requested' : task?.status?.charAt(0).toUpperCase() + task?.status?.slice(1).replace('-', ' ')}</span>
              </div>
              {task?.status === 'assigned' && (
                <p className="ml-7 text-sm mt-1">This task has been assigned and work will begin soon.</p>
              )}
              {task?.status === 'inProgress' && (
                <p className="ml-7 text-sm mt-1">This task is currently in progress.</p>
              )}
              {task?.status === 'completionRequested' && (
                <p className="ml-7 text-sm mt-1">The tasker has requested to mark this task as completed.</p>
              )}
              {task?.status === 'completed' && (
                <p className="ml-7 text-sm mt-1">This task has been completed successfully.</p>
              )}
              {task?.status === 'cancelled' && (
                <p className="ml-7 text-sm mt-1">This task has been cancelled.</p>
              )}
            </div>
            
            {/* Chat Interface (conditionally rendered) */}
            {showChat && isChatAvailable && (
              <div className="mb-6">
                <ChatInterface 
                  taskId={task?._id} 
                  otherUserId={chatPartnerId} 
                  otherUserName={chatPartnerName} 
                />
              </div>
            )}
            
            {/* Task Completion Section */}
            {showTaskCompletion && (
              <TaskCompletion 
                task={task} 
                onTaskUpdate={refreshTaskDetails} 
              />
            )}
            
            {/* Main Task Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{task?.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {typeof task?.category === 'object' && task?.category !== null 
                    ? task?.category.name 
                    : task?.category}
                </span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {task?.location?.city}
                </span>
                {task?.deadline && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    Due: {formatDate(task?.deadline)}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                  <p className="text-2xl font-bold text-gray-900">₹{task?.budget}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Posted By</h3>
                  <p className="text-gray-900">{task?.customer.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Posted On</h3>
                  <p className="text-gray-900">{formatDate(task?.createdAt)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{task?.description}</p>
              </div>

              {/* Fee Breakdown - Visible to Task Owner and Admin */}
              {(isTaskOwner || isAdmin) && (task?.status === 'open' || task?.status === 'assigned' || task?.status === 'inProgress' || task?.status === 'completionRequested' || task?.status === 'completed') && (
                <div className="mt-6 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Task Budget:</span>
                      <span className="font-medium text-gray-800">₹{task?.budget?.toFixed(2)}</span>
                    </div>
                    {task?.platformFee !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Fee:</span>
                        <span className="font-medium text-gray-800">₹{task?.platformFee?.toFixed(2)}</span>
                      </div>
                    )}
                    {task?.trustAndSupportFee !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trust & Support Fee:</span>
                        <span className="font-medium text-gray-800">₹{task?.trustAndSupportFee?.toFixed(2)}</span>
                      </div>
                    )}
                    {task?.totalAmountPaidByCustomer !== undefined && (
                      <>
                        <hr className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-gray-700 font-semibold">Total Amount Payable:</span>
                          <span className="font-bold text-gray-900">₹{task?.totalAmountPaidByCustomer?.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {isAdmin && task?.commissionRate !== undefined && task?.commissionAmount !== undefined && task?.finalTaskerPayout !== undefined && (
                    <div className="mt-4 pt-3 border-t border-gray-300 space-y-2 text-sm">
                      <h4 className="text-md font-semibold text-gray-700 mb-1">For Admin & Tasker View:</h4>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission ({(task?.commissionRate * 100).toFixed(0)}%):</span>
                        <span className="font-medium text-gray-800">- ₹{task?.commissionAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-semibold">Final Tasker Payout:</span>
                        <span className="font-semibold text-green-600">₹{task?.finalTaskerPayout?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {task?.images && task?.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {task?.images.map((image, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <img 
                          src={image} 
                          alt={`Task image ${index + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Bid Section */}
            {isTasker && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4">{userBid && showBidForm ? 'Edit Your Bid' : 'Submit Your Bid'}</h2>
                {showBidForm ? (
                  <form onSubmit={handleBidSubmit}>
                    {console.log('Bid form status:', showBidForm)}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Bid Amount (₹)*</label>
                        <input
                          type="number"
                          name="amount"
                          value={bidData.amount}
                          onChange={handleBidChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your bid amount"
                          required
                          min="1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Task budget: ₹{task?.budget}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Your Message*</label>
                        <textarea
                          name="message"
                          value={bidData.message}
                          onChange={handleBidChange}
                          rows="4"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe how you'll complete this task, your experience, and why you're the best fit."
                          required
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Estimated Days to Complete (Optional)</label>
                        <input
                          type="number"
                          name="estimatedDays"
                          value={bidData.estimatedDays}
                          onChange={handleBidChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Number of days"
                          min="1"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => setShowBidForm(false)}
                          className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300 transition order-2 sm:order-1"
                          disabled={submittingBid}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition order-1 sm:order-2"
                          disabled={submittingBid}
                        >
                          {submittingBid ? 'Submitting...' : (userBid ? 'Update Bid' : 'Submit Bid')}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : userBid ? (
                  <div>
                    {userBid.status === 'rejected' ? (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">⚠️</div>
                          <div className="flex-1">
                            <p className="text-red-800 font-semibold text-lg mb-2">Your bid has been rejected</p>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm text-gray-700">Your bid amount: <span className="font-medium text-gray-900">₹{userBid.amount}</span></p>
                              <p className="text-sm text-gray-700">Status: <span className="font-medium text-red-700 capitalize">{userBid.status}</span></p>
                              {userBid.estimatedDays && (
                                <p className="text-sm text-gray-700 mt-1">Estimated days: <span className="font-medium text-gray-900">{userBid.estimatedDays}</span></p>
                              )}
                              {userBid.rejectionReason && (
                                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
                                  <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                                  <p className="text-sm text-red-800">{userBid.rejectionReason}</p>
                                </div>
                              )}
                              {!userBid.rejectionReason && (
                                <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded-md">
                                  <p className="text-sm text-gray-600 italic">No rejection reason provided by the customer.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : userBid.status === 'accepted' ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 font-semibold text-lg mb-2">🎉 Congratulations! Your bid has been accepted</p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-700">Your bid amount: <span className="font-medium text-gray-900">₹{userBid.amount}</span></p>
                          <p className="text-sm text-gray-700 mt-1">Status: <span className="font-medium text-green-700 capitalize">{userBid.status}</span></p>
                          {userBid.estimatedDays && (
                            <p className="text-sm text-gray-700 mt-1">Estimated days: <span className="font-medium text-gray-900">{userBid.estimatedDays}</span></p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-blue-800 font-medium">You have already placed a bid on this task.</p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Your bid amount: <span className="font-medium text-gray-900">₹{userBid.amount}</span></p>
                          <p className="text-sm text-gray-600 mt-1">Status: <span className="font-medium capitalize">{userBid.status}</span></p>
                          {userBid.estimatedDays && (
                            <p className="text-sm text-gray-600 mt-1">Estimated days: <span className="font-medium text-gray-900">{userBid.estimatedDays}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Your Message</h3>
                      <p className="text-gray-700">{userBid.message}</p>
                    </div>

                    {userBid.status === 'pending' && task?.status === 'open' && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            console.log('Editing bid:', userBid);
                            setBidData({
                              amount: userBid.amount.toString(),
                              message: userBid.message,
                              estimatedDays: userBid.estimatedDays ? userBid.estimatedDays.toString() : ''
                            });
                            setShowBidForm(true);
                            console.log('Bid form status:', showBidForm);
                            console.log('Bid data after setting:', bidData);
                          }}
                          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                        >
                          Edit Bid
                        </button>
                      </div>
                    )}

                    {userBid.status === 'rejected' && task?.status === 'open' && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-700 mb-3">
                          Your bid has been rejected. You can still find other tasks to bid on.
                        </p>
                        <Link
                          to="/tasks"
                          className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition text-sm"
                        >
                          Browse Other Tasks
                        </Link>
                      </div>
                    )}
                  </div>
                ) : task?.status === 'open' ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                      Interested in this task? Submit a bid with your message and price.
                    </p>
                    <button
                      onClick={() => setShowBidForm(true)}
                      className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
                    >
                      Place a Bid
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700">This task is no longer accepting bids.</p>
                    <p className="text-sm text-gray-600 mt-2">Current status: <span className="font-medium capitalize">{task?.status}</span></p>
                  </div>
                )}
              </div>
            )}
            {/* Bids Section - Visible to task owner, admin, or taskers for open tasks */}
            {(canSeeBids || (isTasker && task?.status === 'open')) && task?.bids && task?.bids.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4">
                  {isTasker && !canSeeBids ? 'Other Bids' : `Bids (${task?.bids.length})`}
                </h2>
                
                {task?.bids.length === 0 ? (
                  <p className="text-gray-600">{isTasker && !canSeeBids ? 'No other bids have been placed on this task yet.' : 'No bids have been placed on this task yet.'}</p>
                ) : (
                  <div className="space-y-4">
                    {task?.bids
                      .filter(bid => isTasker && !canSeeBids ? bid.tasker._id !== currentUser._id : true)
                      .map(bid => (
                    <div key={bid._id} className="border rounded-lg p-4">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            <Link 
                              to={`/tasker/${bid.tasker._id}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {bid.tasker.name}
                            </Link>
                          </h3>
                          <div className="flex items-center">
                            {bid.tasker.totalReviews > 0 ? (
                              <div className="flex items-center text-sm text-yellow-500">
                                <span className="mr-1">{bid.tasker.avgRating.toFixed(1)}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-xs text-gray-500">
                                  ({bid.tasker.totalReviews} {bid.tasker.totalReviews === 1 ? 'review' : 'reviews'})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No reviews yet</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Bid placed on: {formatDate(bid.createdAt)}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">₹{bid.amount}</p>
                          {bid.estimatedDays && (
                            <p className="text-sm text-gray-600">
                              Estimated completion: {bid.estimatedDays} day{bid.estimatedDays !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Message</h4>
                        <p className="text-gray-700 mt-1">{bid.message}</p>
                      </div>
                      
                      {canSeeBids && isTaskOwner && task?.status === 'open' && bid.status === 'pending' && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejecting this bid (optional):');
                              handleRejectBid(bid._id, reason || '');
                            }}
                            className="bg-red-100 text-red-600 py-1 px-4 rounded hover:bg-red-200 transition text-sm order-2 sm:order-1"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAcceptBid(bid._id)}
                            className="bg-green-100 text-green-600 py-1 px-4 rounded hover:bg-green-200 transition text-sm order-1 sm:order-2"
                          >
                            Accept Bid
                          </button>
                        </div>
                      )}
                      
                      {bid.status !== 'pending' && (
                        <div className="mt-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                          </span>
                          
                          {/* Show rejection info - with special emphasis for taskers viewing their own rejected bid */}
                          {bid.status === 'rejected' && (
                            <div className={`mt-3 p-3 rounded-md ${
                              isTasker && bid.tasker._id === currentUser._id 
                                ? 'bg-red-50 border-2 border-red-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <div className="flex items-start gap-2">
                                {isTasker && bid.tasker._id === currentUser._id && (
                                  <span className="text-lg">⚠️</span>
                                )}
                                <div className="flex-1">
                                  {isTasker && bid.tasker._id === currentUser._id && (
                                    <p className="text-sm font-semibold text-red-900 mb-2">Your bid has been rejected</p>
                                  )}
                                  {bid.rejectionReason ? (
                                    <>
                                      <p className={`${isTasker && bid.tasker._id === currentUser._id ? 'text-xs' : 'text-sm'} font-medium text-red-900 mb-1`}>
                                        Rejection Reason:
                                      </p>
                                      <p className={`${isTasker && bid.tasker._id === currentUser._id ? 'text-sm' : 'text-sm'} text-red-800`}>
                                        {bid.rejectionReason}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-600 italic">No rejection reason provided by the customer.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};




export default React.memo(TaskDetailPage);