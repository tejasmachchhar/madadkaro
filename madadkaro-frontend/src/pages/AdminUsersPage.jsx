import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavigation from '../components/AdminNavigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [page, roleFilter, statusFilter]);
  
  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      
      if (search) {
        params.append('search', search);
      }
      
      if (roleFilter) {
        params.append('role', roleFilter);
      }
      
      if (statusFilter) {
        params.append('isActive', statusFilter === 'active');
      }
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      
      setUsers(response.data.users);
      setPage(response.data.page);
      setPages(response.data.pages);
      setTotalUsers(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };
  
  const handleStatusChange = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive });
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
      
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Error updating user status:', error);
    }
  };
  
  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/api/users/${userId}`, { role });
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role } : user
      ));
      
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/api/users/${userToDelete}`);
      
      // Remove the user from the local state
      setUsers(users.filter(user => user._id !== userToDelete));
      
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600">Manage platform users - {totalUsers} total users</p>
          </div>
          
          {/* Filter and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="tasker">Taskers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {user.profilePicture ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profilePicture}
                                  alt={user.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user._id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          >
                            <option value="customer">Customer</option>
                            <option value="tasker">Tasker</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={user.isActive !== false}
                                onChange={() => handleStatusChange(user._id, user.isActive === false)}
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ms-3 text-sm font-medium text-gray-600">
                                {user.isActive === false ? 'Inactive' : 'Active'}
                              </span>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setUserToDelete(user._id);
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
                    <span className="font-medium">{Math.min(page * 10, totalUsers)}</span> of{' '}
                    <span className="font-medium">{totalUsers}</span> users
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
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 order-1 sm:order-2"
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

export default AdminUsersPage;