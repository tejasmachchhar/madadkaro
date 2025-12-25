import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux'; // Added
import { fetchCategories } from '../store/slices/tasksSlice'; // Added
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import CategorySection from '../components/CategorySection'; // Updated import
import HomeLocationSelector from '../components/HomeLocationSelector';

const CustomerHomePage = () => {
  const dispatch = useDispatch(); // Added
  const { currentUser, isCustomer } = useAuth();
  const { 
    customerTasks: myRecentTasks, 
    customerTasksLoading: tasksLoading, 
    categories, 
    getCustomerTasks 
  } = useTasks();
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationData, setLocationData] = useState(null);
  const popularCategories = ['cleaning', 'handyman', 'delivery']; // Made it a const

  useEffect(() => {
    // Redirect if not a customer
    if (!isCustomer) {
      navigate('/');
      return;
    }
    
    dispatch(fetchCategories()); // Added
    // Fetch tasks data
    getCustomerTasks({ limit: 3 });
    
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
  }, [dispatch, getCustomerTasks, isCustomer, navigate]); // Added dispatch to dependencies

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



  // Task status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-green-100 text-green-800';
      case 'inProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completionRequested':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12 rounded-lg mb-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8">
            <h1 className="text-3xl font-bold mb-4">Welcome back, {currentUser?.name}!</h1>
            <p className="text-xl mb-6">
              Ready to get some help today? Post a new task or manage your existing ones.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/post-task" className="btn-secondary px-8 py-3 text-lg">
                Post a New Task
              </Link>
              <Link to="/my-tasks" className="bg-white text-primary-700 hover:bg-primary-100 px-8 py-3 rounded-md text-lg transition-colors">
                View My Tasks
              </Link>
            </div>
          </div>
          <div className="w-full md:w-2/5 lg:w-1/3">
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{myRecentTasks.filter(task => task.status === 'open').length}</div>
                  <div className="text-sm">Open Tasks</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{myRecentTasks.filter(task => task.status === 'assigned').length}</div>
                  <div className="text-sm">Assigned</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{myRecentTasks.filter(task => task.status === 'inProgress').length}</div>
                  <div className="text-sm">In Progress</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{myRecentTasks.filter(task => task.status === 'completed').length}</div>
                  <div className="text-sm">Completed</div>
                </div>
              </div>
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
                placeholder="What do you need help with?"
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

      {/* My Recent Tasks */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Recent Tasks</h2>
          <Link to="/my-tasks" className="text-primary-600 hover:text-primary-800 font-medium">
            View All →
          </Link>
        </div>
        
        {tasksLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your tasks...</p>
          </div>
        ) : myRecentTasks.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't posted any tasks yet. Get started by creating your first task!
            </p>
            <Link to="/post-task" className="btn-primary px-6 py-2">
              Post Your First Task
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {myRecentTasks.map((task) => (
              <div key={task._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
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

      {/* Find Taskers by Category */}
      <CategorySection 
        locationData={locationData} 
        popularCategories={popularCategories} 
        userRole="customer" // Pass userRole to CategorySection
      />

      {/* Post a New Task */}
      <section className="mb-16 bg-primary-50 p-8 rounded-lg">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
            <h2 className="text-2xl font-bold mb-4">Need Something Done?</h2>
            <p className="text-lg mb-6">
              Post a task with your requirements, budget, and location to find the perfect tasker for your needs.
            </p>
            <Link to="/post-task" className="btn-primary px-8 py-3 inline-block">
              Post a Task Now
            </Link>
          </div>
          <div className="md:w-1/3 text-center">
            <div className="text-7xl">📝</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomePage;