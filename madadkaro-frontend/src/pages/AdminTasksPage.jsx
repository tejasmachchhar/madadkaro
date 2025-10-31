import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavigation from '../components/AdminNavigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminTasksPage = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    if (isAdmin()) {
      fetchTasks();
      fetchCategories();
    }
  }, [page, statusFilter, categoryFilter]);
  
  useEffect(() => {
    if (categoryFilter) {
      const category = categories.find(cat => cat._id === categoryFilter);
      if (category && category.subcategories && category.subcategories.length > 0) {
        setSubcategories(category.subcategories);
      } else {
        setSubcategories([]);
      }
      
      // Reset subcategory when changing categories
      setSubcategoryFilter('');
    } else {
      setSubcategories([]);
      setSubcategoryFilter('');
    }
  }, [categoryFilter, categories]);
  
  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchTasks = async (search = '') => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      
      if (search) {
        queryParams.append('search', search);
      }
      
      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }
      
      if (categoryFilter) {
        queryParams.append('category', categoryFilter);
      }
      
      if (subcategoryFilter) {
        queryParams.append('subcategory', subcategoryFilter);
      }
      
      queryParams.append('page', page);
      queryParams.append('limit', 10);
      
      const { data } = await api.get(`/admin/tasks?${queryParams.toString()}`);
      setTasks(data.tasks);
      setTotalTasks(data.totalTasks);
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTasks(searchTerm);
  };
  
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      await api.delete(`/admin/tasks/${taskToDelete}`);
      
      // Remove the task from the local state
      setTasks(tasks.filter(task => task._id !== taskToDelete));
      
      toast.success('Task deleted successfully');
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
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
            <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
            <p className="text-gray-600">Manage platform tasks - {totalTasks} total tasks</p>
          </div>
          
          {/* Filter and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Search tasks by title or description..."
                    className="border border-gray-300 rounded-l-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white rounded-r-lg px-4 py-2 hover:bg-blue-700 transition"
                  >
                    Search
                  </button>
                </form>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                {categoryFilter && subcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subcategory</label>
                    <select
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={subcategoryFilter}
                      onChange={(e) => setSubcategoryFilter(e.target.value)}
                    >
                      <option value="">All Subcategories</option>
                      {subcategories.map(subcategory => (
                        <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tasks Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No tasks found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-0">
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-sm text-gray-500">ID: {task._id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{task.customer?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{task.customer?.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(task.budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.category?.name || 'Uncategorized'}
                          {task.subcategory && (
                            <div className="text-sm text-gray-500">
                              {task.subcategory.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'open' ? 'bg-green-100 text-green-800' :
                            task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(task.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/tasks/${task._id}`} className="text-blue-600 hover:text-blue-900">
                            View
                          </Link>
                          <button
                            onClick={() => {
                              setTaskToDelete(task._id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 10, totalTasks)}</span> of{' '}
                    <span className="font-medium">{totalTasks}</span> tasks
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                    disabled={page === pages}
                    className={`px-3 py-1 rounded ${
                      page === pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone and will also remove all associated bids.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasksPage;