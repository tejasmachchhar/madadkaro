import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBids } from '../hooks/useBids';
import { toast } from 'react-toastify';
import TaskCompletionButton from '../components/TaskCompletionButton';
import realtimeService from '../services/realtimeService';

const MyBidsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isTasker } = useAuth();
  const { getMyBids, myBids, myBidsLoading } = useBids();
  
  // Get initial tab from URL params, localStorage, or default based on source
  const getInitialTab = () => {
    // Check if coming from home page via URL param or location state
    const urlParams = new URLSearchParams(location.search);
    const fromHome = urlParams.get('from') === 'home' || location.state?.fromHome;
    
    if (fromHome) {
      return 'all'; // Default to "All Bids" when coming from home page
    }
    
    // Otherwise, use the last remembered tab or default to 'active'
    const lastTab = localStorage.getItem('myBidsLastTab');
    return lastTab || 'active';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Save tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('myBidsLastTab', activeTab);
  }, [activeTab]);

  // Update tab when location changes (e.g., when coming from home page)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fromHome = urlParams.get('from') === 'home' || location.state?.fromHome;
    
    if (fromHome && activeTab !== 'all') {
      setActiveTab('all');
    }
  }, [location.search, location.state]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (!isTasker) {
      navigate('/');
      return;
    }
    
    fetchBids();
  }, [activeTab, currentUser, isTasker, navigate]);
  
  // Set up real-time listeners for bid updates
  useEffect(() => {
    const unsubscribers = [];
    
    // Listen for bid status changes
    const unsubBidStatus = realtimeService.subscribe('bid_status_changed', (data) => {
      // Refetch bids when a bid status changes
      fetchBids();
    });
    unsubscribers.push(unsubBidStatus);
    
    // Listen for bid updates
    const unsubBidUpdate = realtimeService.subscribe('bid_updated', (data) => {
      // Refetch bids when a bid is updated
      fetchBids();
    });
    unsubscribers.push(unsubBidUpdate);
    
    // Listen for task status changes (which might affect bid status)
    const unsubTaskStatus = realtimeService.subscribeToUserTasks((data) => {
      // Refetch bids when task status changes
      fetchBids();
    });
    unsubscribers.push(unsubTaskStatus);
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [activeTab]);

  const fetchBids = async () => {
    try {
      if (activeTab === 'active') {
        // For active tab, only show pending bids and accepted bids with non-completed tasks
        getMyBids({ 
          status: 'pending,accepted',
          taskStatus: '!completed' // Only non-completed tasks
        });
      } else if (activeTab === 'completed') {
        // For completed & others tab, show all non-active bids (rejected/cancelled) and completed tasks
        getMyBids({ 
          status: 'rejected,cancelled,accepted',
          taskStatus: '!assigned' // Don't filter by task status for rejected/cancelled bids
        });
      } else if (activeTab === 'all') {
        // For all bids tab, fetch all bids without status filter
        getMyBids({ limit: 100 }); // Fetch a large number to get all bids
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'inProgress': 'bg-blue-100 text-blue-800',
      'completionRequested': 'bg-orange-100 text-orange-800',
      'completed': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    const statusLabels = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'inProgress': 'In Progress',
      'completionRequested': 'Completion Requested',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Bids</h1>
          <Link
            to="/tasks"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Find Tasks to Bid
          </Link>
        </div>
        
        <div className="mb-6 border-b">
          <div className="flex space-x-8">
            <button
              className={`py-3 px-1 font-medium ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Bids
            </button>
            <button
              className={`py-3 px-1 font-medium ${
                activeTab === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active Bids
            </button>
            <button
              className={`py-3 px-1 font-medium ${
                activeTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed & Others
            </button>
          </div>
        </div>

        {myBidsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your bids...</p>
          </div>
        ) : !myBids || myBids.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No bids found</h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'active'
                ? "You don't have any active bids. Find a task and place your first bid!"
                : activeTab === 'all'
                ? "You don't have any bids yet. Find a task and place your first bid!"
                : "You don't have any completed, rejected, or cancelled bids."}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/tasks"
                className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Find Tasks
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort bids for 'all' tab: active bids (pending + accepted with non-completed tasks) first, then others */}
            {(() => {
              const sortedBids = activeTab === 'all'
                ? [...myBids].sort((a, b) => {
                    // Active bids: pending bids OR accepted bids with non-completed tasks
                    const isActiveA = a.status === 'pending' ||
                      (a.status === 'accepted' && a.task && a.task.status !== 'completed');
                    const isActiveB = b.status === 'pending' ||
                      (b.status === 'accepted' && b.task && b.task.status !== 'completed');

                    if (isActiveA && !isActiveB) return -1;
                    if (!isActiveA && isActiveB) return 1;
                    return 0; // Maintain original order for same priority bids
                  })
                : myBids;

              return sortedBids.map((bid) => (
              <div key={bid._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-semibold text-gray-800 mr-3">
                        {bid.task ? bid.task.title : 'Task'}
                      </h2>
                      {getStatusBadge(
                        bid.status === 'accepted' && bid.task
                          ? bid.task.status
                          : bid.status
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-gray-500">Your Bid</span>
                        <p className="text-lg font-semibold text-gray-900">₹{bid.amount}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Task Budget</span>
                        <p className="text-sm font-medium">₹{bid.task ? bid.task.budget : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Bid Placed On</span>
                        <p className="text-sm font-medium">{formatDate(bid.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-xs text-gray-500">Your Proposal</span>
                      <p className="text-gray-700 mt-1">{bid.message}</p>
                    </div>
                    
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Link
                      to={bid.task ? `/tasks/${bid.task._id}` : '#'}
                      className="bg-blue-100 text-blue-600 py-2 px-4 rounded hover:bg-blue-200 transition text-center"
                    >
                      View Task
                    </Link>
                    
                    {bid.status === 'pending' && (
                      <button
                        onClick={() => navigate(`/tasks/${bid.task._id}`, { state: { editBid: true } })}
                        className="bg-gray-100 text-gray-600 py-2 px-4 rounded hover:bg-gray-200 transition"
                      >
                        Edit Bid
                      </button>
                    )}
                    
                    {/* Add Mark Completed button for tasks in progress */}
                    {bid.status === 'accepted' && 
                     bid.task && 
                     bid.task.status === 'inProgress' && (
                       <TaskCompletionButton 
                         taskId={bid.task._id} 
                         onComplete={fetchBids}
                       />
                     )}
                  </div>
                </div>
                
                {(bid.status === 'accepted' && bid.task.status === !'completed') && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Congratulations!</span> Your bid has been accepted. Please contact the customer to start the work.
                    </p>
                  </div>
                )}
                
                {bid.status === 'rejected' && bid.rejectionReason && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Rejection reason:</span> {bid.rejectionReason}
                    </p>
                  </div>
                )}

                {bid.task.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Congratulations!</span> You have completed this task.
                    </p>
                  </div>
                )}

              </div>
            ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBidsPage;