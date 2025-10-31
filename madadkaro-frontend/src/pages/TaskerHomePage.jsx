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
        getMyBids({ limit: 3 });
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
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12 rounded-lg mb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:mr-8 md:w-1/2">
              <h1 className="text-3xl font-bold mb-4">Welcome back, {currentUser?.name}!</h1>
              <p className="text-xl mb-6">
                Find and complete tasks to earn money with your skills. Browse available tasks or check your active bids.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/tasks" className="btn-secondary px-8 py-3 text-lg">
                  Find Tasks
                </Link>
                <Link to="/my-bids" className="bg-white text-primary-700 hover:bg-primary-100 px-8 py-3 rounded-md text-lg transition-colors">
                  My Bids
                </Link>
              </div>
            </div>
            
            <div className="w-full md:w-2/5 bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Your Activity</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{Array.isArray(activeBids) ? activeBids.length : 0}</div>
                  <div className="text-sm">Active Jobs</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{Array.isArray(pendingBids) ? pendingBids.length : 0}</div>
                  <div className="text-sm">Pending Bids</div>
                </div>
              </div>
              
              <Link to="/my-bids" className="block w-full bg-white bg-opacity-20 hover:bg-opacity-30 p-4 rounded-lg text-center transition-colors">
                <div className="text-lg font-semibold">View All Bids</div>
              </Link>
            </div>
          </div>
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
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
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
              <div key={task._id} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    <Link to={`/tasks/${task._id}`} className="text-primary-600 hover:text-primary-800">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Recent Bids */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Recent Bids</h2>
          <Link to="/my-bids" className="text-primary-600 hover:text-primary-800 font-medium">
            View All →
          </Link>
        </div>
        
        {bidsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your bids...</p>
          </div>
        ) : myBids.length === 0 ? (
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
            {myBids.map((bid) => (
              <div key={bid._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1">{bid.task?.title || 'Task'}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBidStatusBadgeColor(bid.status)}`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{bid.note || 'No description provided'}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-primary-700 font-semibold">₹{bid.bidAmount}</div>
                    <Link to={`/tasks/${bid.task?._id}`} className="text-primary-600 hover:text-primary-800">
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