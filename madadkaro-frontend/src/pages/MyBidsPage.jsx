import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBids } from '../hooks/useBids';
import { toast } from 'react-toastify';
import TaskCompletionButton from '../components/TaskCompletionButton';

const MyBidsPage = () => {
  const navigate = useNavigate();
  const { currentUser, isTasker } = useAuth();
  const { getMyBids, myBids, myBidsLoading } = useBids();
  const [activeTab, setActiveTab] = useState('active');

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

  const fetchBids = async () => {
    try {
        if (activeTab === 'active') {
        // For active tab, only show pending bids and accepted bids with non-completed tasks
        getMyBids({ 
          status: 'pending,accepted',
          taskStatus: '!completed' // Only non-completed tasks
        });
      } else {
        // For completed & others tab, show all non-active bids (rejected/cancelled) and completed tasks
        getMyBids({ 
          status: 'rejected,cancelled,accepted',
          taskStatus: '!assigned' // Don't filter by task status for rejected/cancelled bids
        });
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
            {myBids.map((bid) => (
              <div key={bid._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-semibold text-gray-800 mr-3">
                        {bid.task ? bid.task.title : 'Task'}
                      </h2>
                      {getStatusBadge(bid.status)}
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
                    
                    {/* Show task status if bid is accepted */}
                    {bid.status === 'accepted' && bid.task && (
                      <div className="mb-4">
                        <span className="text-xs text-gray-500">Task Status</span>
                        <div className="mt-1">
                          {getStatusBadge(bid.task.status)}
                        </div>
                      </div>
                    )}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBidsPage;