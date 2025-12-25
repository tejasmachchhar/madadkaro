import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux'; // Added
import { fetchCategories } from '../store/slices/tasksSlice'; // Added
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useBids } from '../hooks/useBids';
import HomeLocationSelector from '../components/HomeLocationSelector';
import CategorySection from '../components/CategorySection'; // Updated import

const TaskerHomePage = () => {
  const dispatch = useDispatch(); // Added
  const { currentUser, isTasker } = useAuth();
  const { 
    availableTasks, 
    availableTasksLoading: tasksLoading, 
    categories, 
    getAvailableTasks 
  } = useTasks();
  const { 
    myBids, 
    myBidsLoading: bidsLoading, 
    activeBids, 
    pendingBids,
    rejectedBids,
    getMyBids 
  } = useBids();
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationData, setLocationData] = useState(null);
  const popularCategories = ['cleaning', 'handyman', 'moving']; // Made it a const

  useEffect(() => {
    // Redirect if not a tasker
    if (!isTasker) {
      navigate('/');
      return;
    }
    
    dispatch(fetchCategories()); // Added
    // Fetch tasks for everyone (even non-authenticated users can see available tasks)
    getAvailableTasks({ limit: 3, status: 'open' });
    
    // Only fetch bids if the user is authenticated as a tasker
    if (isTasker && currentUser?._id) {
      try {
        // Fetch all bids (including rejected) so selectors can filter them properly
        // Using a higher limit to ensure rejected bids are included
        getMyBids({ limit: 20 });
      } catch (error) {
        console.error("Failed to fetch bids:", error);
        // No need to display an error toast here, handled in the hook
      }
    }
    
    // Check for saved location
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocationData(parsedLocation);
      } catch (error) {
        console.error('Failed to parse saved location:', error);
        localStorage.removeItem('userLocation');
      }
    }
  }, [dispatch, getAvailableTasks, getMyBids, isTasker, currentUser, navigate]); // Added dispatch to dependencies

  const handleLocationSelect = (location) => {
    setLocationData(location);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('keyword', searchQuery);
    }
    
    if (locationData) {
      params.append('location', locationData.address);
      if (locationData.lat && locationData.lng) {
        params.append('lat', locationData.lat);
        params.append('lng', locationData.lng);
      }
    }
    
    navigate(`/tasks?${params.toString()}`);
  };



  // Bid status badge color
  const getBidStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Task status badge color
  const getTaskStatusBadgeColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'inProgress':
        return 'bg-purple-100 text-purple-800';
      case 'completionRequested':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Task status labels
  const getTaskStatusLabel = (status) => {
    switch (status) {
      case 'inProgress':
        return 'In Progress';
      case 'completionRequested':
        return 'Completion Requested';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div>
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-12 rounded-xl mb-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-10 w-80 h-80 bg-secondary-400/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 border border-white/20 text-sm mb-4">
                <span className="mr-2">👋</span> Welcome back, {currentUser?.name || 'Tasker'}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">Find tasks. Bid fast. Grow your earnings.</h1>
              <p className="text-white/90 text-lg mb-6">Discover nearby work, track your bids, and manage your workflow in one place.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/tasks" className="bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-md text-base font-semibold transition-colors">
                  Browse Tasks
                </Link>
                <Link to="/my-bids?from=home" className="bg-primary-900/30 hover:bg-primary-900/40 border border-white/20 px-6 py-3 rounded-md text-base font-semibold transition-colors text-white">
                  View My Bids
                </Link>
              </div>
            </div>
            <div className="w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/10">
                  <div className="text-sm text-white/80">Active Jobs</div>
                  <div className="mt-2 text-3xl font-bold">{Array.isArray(activeBids) ? activeBids.length : 0}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/10">
                  <div className="text-sm text-white/80">Pending Bids</div>
                  <div className="mt-2 text-3xl font-bold">{Array.isArray(pendingBids) ? pendingBids.length : 0}</div>
                </div>
                {Array.isArray(rejectedBids) && rejectedBids.length > 0 && (
                  <div className="bg-red-500/20 backdrop-blur-sm p-5 rounded-lg border border-red-300/30 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white/90">Rejected Bids</div>
                        <div className="mt-2 text-2xl font-bold text-white">{rejectedBids.length}</div>
                      </div>
                      <Link to="/my-bids?from=home" className="text-sm text-white/90 hover:text-white underline">
                        View Details →
                      </Link>
                    </div>
                  </div>
                )}
                <Link to="/my-bids?from=home" className="col-span-2 bg-white/10 hover:bg-white/20 transition-colors p-5 rounded-lg border border-white/10 text-center">
                  <div className="text-base font-semibold">Open Bid Dashboard →</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/tasks" className="group border border-gray-200 hover:border-primary-200 rounded-lg p-4 transition-colors bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Browse</div>
                <div className="font-semibold">Available Tasks</div>
              </div>
              <span className="text-primary-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
          <Link to="/my-bids?from=home" className="group border border-gray-200 hover:border-primary-200 rounded-lg p-4 transition-colors bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Check</div>
                <div className="font-semibold">My Bids</div>
              </div>
              <span className="text-primary-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
          <Link to="/profile" className="group border border-gray-200 hover:border-primary-200 rounded-lg p-4 transition-colors bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Update</div>
                <div className="font-semibold">Profile</div>
              </div>
              <span className="text-primary-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
          <Link to="/tasks?status=open" className="group border border-gray-200 hover:border-primary-200 rounded-lg p-4 transition-colors bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Filter</div>
                <div className="font-semibold">Open Only</div>
              </div>
              <span className="text-primary-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Location Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Location</h2>
        </div>
        <HomeLocationSelector 
          onLocationSelect={handleLocationSelect}
          initialLocation={locationData}
        />
        {locationData && (
          <form onSubmit={handleSearch} className="mt-4">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What type of work are you looking for?"
                className="w-full px-4 py-3 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-primary-900"
              />
              <button 
                type="submit" 
                className="bg-secondary-600 hover:bg-secondary-700 px-6 py-3 rounded-r-md transition-colors text-white"
              >
                Search
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Available Tasks */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Available Tasks</h2>
          <Link to="/tasks" className="text-primary-600 hover:text-primary-800 font-medium">
            View All →
          </Link>
        </div>
        
        {tasksLoading ? (
          <div className="grid md:grid-cols-3 gap-6" aria-label="Loading tasks">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : availableTasks.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No Tasks Available</h3>
            <p className="text-gray-600 mb-6">
              There are no tasks available in your area right now. Try changing your location or check back later.
            </p>
            <button 
              onClick={() => getAvailableTasks({ limit: 3, status: 'open' })}
              className="btn-primary px-6 py-2"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {availableTasks.map((task) => (
              <div key={task._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusBadgeColor(task.status)}`}>
                      {getTaskStatusLabel(task.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-primary-700 font-semibold">₹{task.budget}</div>
                    <Link to={`/tasks/${task._id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rejected Bids Section - Prominently Displayed */}
      {Array.isArray(rejectedBids) && rejectedBids.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Rejected Bids</h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {rejectedBids.length} {rejectedBids.length === 1 ? 'Bid' : 'Bids'}
              </span>
            </div>
            <Link to="/my-bids?from=home" className="text-primary-600 hover:text-primary-800 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Important: You have rejected bids</h3>
                <p className="text-red-700 text-sm">
                  Review the rejection reasons below to improve your future bids. You can still find other tasks to bid on.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {rejectedBids.slice(0, 4).map((bid) => (
              <div key={bid._id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-red-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1">{bid.task?.title || 'Task'}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBidStatusBadgeColor(bid.status)}`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Your Bid Amount</span>
                      <span className="text-primary-700 font-semibold">₹{bid.bidAmount || bid.amount}</span>
                    </div>
                    {bid.task?.budget && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Task Budget</span>
                        <span className="text-gray-600 text-sm">₹{bid.task.budget}</span>
                      </div>
                    )}
                  </div>

                  {bid.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</div>
                      <p className="text-sm text-red-700">{bid.rejectionReason}</p>
                    </div>
                  )}

                  {!bid.rejectionReason && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-600 italic">No rejection reason provided by the customer.</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Rejected on {bid.updatedAt ? new Date(bid.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <Link 
                      to={`/tasks/${bid.task?._id}`} 
                      className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                    >
                      View Task →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rejectedBids.length > 4 && (
            <div className="mt-6 text-center">
              <Link 
                to="/my-bids?from=home" 
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                View All {rejectedBids.length} Rejected Bids →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* My Recent Bids */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Recent Bids</h2>
          <Link to="/my-bids" className="text-primary-600 hover:text-primary-800 font-medium">
            View All →
          </Link>
        </div>
        
        {bidsLoading ? (
          <div className="grid md:grid-cols-3 gap-6" aria-label="Loading bids">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : myBids.filter(bid => bid.status !== 'rejected').length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2">No Bids Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't made any bids yet. Start by finding tasks and placing your first bid!
            </p>
            <Link to="/tasks" className="btn-primary px-6 py-2">
              Find Tasks
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {myBids.filter(bid => bid.status !== 'rejected').slice(0, 3).map((bid) => (
              <div key={bid._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1">{bid.task?.title || 'Task'}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBidStatusBadgeColor(bid.status)}`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{bid.note || bid.message || 'No description provided'}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-primary-700 font-semibold">₹{bid.bidAmount || bid.amount}</div>
                    <Link to={`/tasks/${bid.task?._id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                      View Task →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Find Tasks by Category */}
      <CategorySection locationData={locationData} popularCategories={popularCategories} />
    </div>
  );
};

export default TaskerHomePage;