import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import api from '../services/api';
import { toast } from 'react-toastify';

const MyTasksPage = () => {
  const { currentUser, isTasker, isCustomer } = useAuth();
  const { getCustomerTasks, customerTasks, customerTasksLoading } = useTasks();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const fetchTasks = async () => {
    try {
      const status = activeTab === 'active' ? 
        'open,assigned,inProgress,completionRequested' : 
        'completed,cancelled';
      getCustomerTasks({ status });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Task ${newStatus === 'cancelled' ? 'cancelled' : 'marked as in progress'} successfully`);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update task status';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'open': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-yellow-100 text-yellow-800',
      'inProgress': 'bg-purple-100 text-purple-800',
      'completionRequested': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      'open': 'Open',
      'assigned': 'Assigned',
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

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Tasks
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'completed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed/Cancelled
          </button>
        </div>
      </div>
      
      {customerTasksLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      ) : customerTasks.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No Tasks Found</h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'active'
              ? "You don't have any active tasks."
              : "You don't have any completed or cancelled tasks."}
          </p>
          {isCustomer && (
            <Link
              to="/post-task"
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Create a New Task
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerTasks.map((task) => (
            <div key={task._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold mb-1 line-clamp-1">{task.title}</h2>
                  {getStatusBadge(task.status)}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(task.dateRequired).toLocaleDateString()}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-blue-700">₹{task.budget}</div>
                  
                  <div className="flex space-x-2">
                    {isCustomer && task.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusChange(task._id, 'inProgress')}
                        className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                      >
                        Start Task
                      </button>
                    )}
                    
                    {task.status === 'open' && isCustomer && (
                      <button
                        onClick={() => handleStatusChange(task._id, 'cancelled')}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Cancel
                      </button>
                    )}
                    
                    <Link
                      to={`/tasks/${task._id}`}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage; 