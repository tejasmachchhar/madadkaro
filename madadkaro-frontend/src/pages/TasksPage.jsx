import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getCurrentPosition, getAddressFromCoordinates } from '../utils/locationUtils';
import LocationPicker from '../components/LocationPicker';

const TasksPage = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    location: '',
    minBudget: '',
    maxBudget: '',
    query: '',
    latitude: '',
    longitude: '',
    distance: '10',
    isUrgent: ''
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    // Apply URL params to filters on initial load
    const locationFromParams = searchParams.get('location');
    const latFromParams = searchParams.get('lat');
    const lngFromParams = searchParams.get('lng');
    
    if (locationFromParams || (latFromParams && lngFromParams)) {
      setFilters(prev => ({
        ...prev,
        location: locationFromParams || '',
        latitude: latFromParams || '',
        longitude: lngFromParams || ''
      }));
    }
    
    fetchTasks();
    fetchCategories();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (filters.category) {
      const category = categories.find(cat => cat._id === filters.category);
      if (category && category.subcategories) {
        setSubcategories(category.subcategories);
      } else {
        setSubcategories([]);
      }
      
      // Reset subcategory if the category changes
      if (filters.subcategory) {
        setFilters(prev => ({ ...prev, subcategory: '' }));
      }
    } else {
      setSubcategories([]);
      if (filters.subcategory) {
        setFilters(prev => ({ ...prev, subcategory: '' }));
      }
    }
  }, [filters.category, categories]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.latitude && filters.longitude) {
        params.append('latitude', filters.latitude);
        params.append('longitude', filters.longitude);
        params.append('distance', filters.distance);
      }
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
      if (filters.query) params.append('keyword', filters.query);
      if (filters.isUrgent) params.append('isUrgent', filters.isUrgent);
      
      // Only get open tasks
      params.append('status', 'open');
      
      const response = await api.get(`/tasks?${params.toString()}`);
      
      // Ensure that tasks is always an array
      const tasksData = Array.isArray(response.data) ? response.data : 
        (response.data && Array.isArray(response.data.tasks) ? response.data.tasks : []);
      setTasks(tasksData);
      
      // Update URL params
      setSearchParams(params);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      setTasks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // This endpoint should return distinct categories from tasks
      const response = await api.get('/tasks/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      // This endpoint should return distinct locations from tasks
      const response = await api.get('/tasks/addresses');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    
    // If changing location, clear lat/lng
    if (name === 'location' && value !== filters.location) {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        latitude: '',
        longitude: ''
      }));
    }
  };

  const handleLocationSelect = (locationData) => {
    setFilters({
      ...filters,
      location: locationData.address,
      latitude: locationData.lat,
      longitude: locationData.lng
    });
    setShowLocationPicker(false);
  };

  const handleCurrentLocation = async () => {
    setIsLocationLoading(true);
    
    try {
      const position = await getCurrentPosition();
      const address = await getAddressFromCoordinates(position.lat, position.lng);
      
      setFilters({
        ...filters,
        location: address,
        latitude: position.lat,
        longitude: position.lng
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error('Could not get your location. Please check your browser permissions.');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      location: '',
      minBudget: '',
      maxBudget: '',
      query: '',
      latitude: '',
      longitude: '',
      distance: '10'
    });
    // After resetting, fetch all tasks
    setTimeout(fetchTasks, 0);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // The backend now provides a hasUserBid flag directly on the task object
  // const alreadyBidded = (task) => {
  //   return task.bids && task.bids.some(bid => bid.tasker === currentUser?._id);
  // };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Tasks</h2>
            <form onSubmit={applyFilters}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Search</label>
                  <input
                    type="text"
                    name="query"
                    value={filters.query}
                    onChange={handleFilterChange}
                    placeholder="Search tasks..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                {filters.category && subcategories.length > 0 && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Subcategory</label>
                    <select
                      name="subcategory"
                      value={filters.subcategory}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Subcategories</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory._id} value={subcategory._id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Urgency</label>
                  <select
                    name="isUrgent"
                    value={filters.isUrgent}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Urgent Only</option>
                    <option value="false">Non-Urgent Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Location</label>
                  <div className="space-y-2">
                    <div className="flex">
                      <input
                        type="text"
                        name="location"
                        value={filters.location}
                        onChange={handleFilterChange}
                        placeholder="Enter location"
                        className="w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(!showLocationPicker)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-r-lg hover:bg-blue-700 transition"
                        title="Pick location on map"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleCurrentLocation}
                      disabled={isLocationLoading}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      {isLocationLoading ? (
                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      Use my current location
                    </button>
                    
                    {filters.latitude && filters.longitude && (
                      <div className="flex items-center mt-2">
                        <label className="block text-gray-700 font-medium mr-2">Distance:</label>
                        <select
                          name="distance"
                          value={filters.distance}
                          onChange={handleFilterChange}
                          className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                          <option value="25">25 km</option>
                          <option value="50">50 km</option>
                          <option value="100">100 km</option>
                        </select>
                      </div>
                    )}
                    
                    {showLocationPicker && (
                      <div className="mt-2 h-64 border rounded-lg overflow-hidden">
                        <LocationPicker
                          onLocationSelect={handleLocationSelect}
                          initialLocation={
                            filters.latitude && filters.longitude 
                              ? { lat: parseFloat(filters.latitude), lng: parseFloat(filters.longitude) }
                              : undefined
                          }
                          height="100%"
                          zoom={12}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Budget Range (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="minBudget"
                      value={filters.minBudget}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      name="maxBudget"
                      value={filters.maxBudget}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex-1"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Tasks List */}
        <div className="lg:w-3/4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Available Tasks</h1>
          
          {loading ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks found</h3>
              <p className="text-gray-600">
                There are no tasks available matching your filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">{task.title}</h2>
                      <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          task.isUrgent && (
                            <span key="urgent" className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                              URGENT
                            </span>
                          ),
                          <span key="category" className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {typeof task.category === 'object' && task.category !== null 
                              ? task.category.name 
                              : task.category}
                          </span>,
                          <span key="address" className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                            {task.address}
                          </span>,
                          task.deadline && (
                            <span key="deadline" className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              Due: {formatDate(task.deadline)}
                            </span>
                          )
                        ]}
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <span className="text-xs text-gray-500">Budget</span>
                          <p className="text-lg font-semibold text-gray-900">₹{task.budget}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Posted</span>
                          <p className="text-sm font-medium">{formatDate(task.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Link 
                        to={`/tasks/${task._id}`} 
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                      >
                        View Details
                      </Link>
                      
                      {task.hasUserBid ? (
                        <div className="text-right">
                          <span className="text-sm text-green-600 block mb-2">You have already bid on this task</span>
                          <Link 
                            to={`/tasks/${task._id}`} 
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View/Edit Bid
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;