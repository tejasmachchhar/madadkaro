import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavigation from '../components/AdminNavigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboardPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    customerCount: 0,
    taskerCount: 0,
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    totalBids: 0,
    totalEarnings: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (isAdmin()) {
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, tasksRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=5&sort=-createdAt'),
        api.get('/admin/tasks?limit=5&sort=-createdAt')
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users);
      setRecentTasks(tasksRes.data.tasks);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive });
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      
      // Update the local state
      setRecentUsers(recentUsers.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <Link to="/" className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/5">
          <AdminNavigation />
        </div>
        
        {/* Main Content */}
        <div className="lg:w-4/5">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser?.name}!</p>
          </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <span className="p-2 bg-blue-100 rounded-full text-blue-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                    <div className="ml-3">
                      <p className="text-xs text-gray-500">
                        {stats.customerCount} Customers
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.taskerCount} Taskers
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Tasks</h3>
                    <span className="p-2 bg-green-100 rounded-full text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTasks}</p>
                    <div className="ml-3">
                      <p className="text-xs text-gray-500">
                        {stats.openTasks} Open
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.completedTasks} Completed
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Bids</h3>
                    <span className="p-2 bg-yellow-100 rounded-full text-yellow-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalBids}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalTasks > 0 ? (stats.totalBids / stats.totalTasks).toFixed(1) : 0} bids per task
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Earnings</h3>
                    <span className="p-2 bg-purple-100 rounded-full text-purple-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(stats.totalEarnings / (stats.completedTasks || 1))} per completed task
                  </p>
                </div>
              </div>
              
              {/* Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-800">Recent Users</h2>
                    <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm">
                      View All
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {recentUsers && recentUsers.length > 0 ? (
                      recentUsers.map(user => (
                        <div key={user._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {user.profilePicture ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profilePicture}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={user.isActive !== false}
                                onChange={() => handleUserStatusChange(user._id, user.isActive === false)}
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No recent users found</p>
                    )}
                  </div>
                </div>
                
                {/* Recent Tasks */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-800">Recent Tasks</h2>
                    <Link to="/admin/tasks" className="text-blue-600 hover:text-blue-800 text-sm">
                      View All
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {recentTasks && recentTasks.length > 0 ? (
                      recentTasks.map(task => (
                        <div key={task._id} className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link 
                                to={`/tasks/${task._id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {task.title}
                              </Link>
                              <p className="text-xs text-gray-500">
                                by {task.customer?.name || 'Unknown'} • {formatDate(task.createdAt)}
                              </p>
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.status === 'open' ? 'bg-green-100 text-green-800' :
                              task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-sm text-gray-600">{formatCurrency(task.budget)}</span>
                            <span className="text-xs text-gray-500">{task.category?.name || 'Uncategorized'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No recent tasks found</p>
                    )}
                  </div>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;