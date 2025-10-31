import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReviews } from '../hooks/useReviews';
import TaskerReview from '../components/TaskerReview';
import TaskerRatingSummary from '../components/TaskerRatingSummary';
import api from '../services/api';
import { toast } from 'react-toastify';

const TaskerProfilePage = () => {
  const { taskerId } = useParams();
  const { taskerReviews, loadingReviews, getTaskerReviews } = useReviews();
  const [tasker, setTasker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTaskerProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/users/${taskerId}`);
        setTasker(response.data);
        
        // Fetch reviews for this tasker
        await getTaskerReviews(taskerId);
      } catch (error) {
        console.error('Error fetching tasker profile:', error);
        toast.error('Could not fetch tasker profile');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskerProfile();
  }, [taskerId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading tasker profile...</p>
        </div>
      </div>
    );
  }

  if (!tasker) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tasker Not Found</h2>
          <p className="text-gray-600 mb-6">The tasker you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        
        {/* Tasker Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="md:flex items-start">
            <div className="md:flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">
                  {tasker.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{tasker.name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {tasker.totalReviews > 0 ? (
                    <>
                      <span className="mr-1 font-medium">{tasker.avgRating.toFixed(1)}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </>
                  ) : (
                    <span className="text-gray-500">No ratings yet</span>
                  )}
                  
                  {tasker.totalReviews > 0 && (
                    <span className="ml-1 text-gray-600">
                      ({tasker.totalReviews} {tasker.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>
                
                <div className="mx-3 text-gray-300">|</div>
                
                <div className="text-gray-600">
                  <span className="font-medium">{tasker.completedTasks || 0}</span> tasks completed
                </div>
              </div>
              
              {tasker.bio && (
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-700 mb-1">About</h3>
                  <p className="text-gray-600">{tasker.bio}</p>
                </div>
              )}
              
              {tasker.skills && tasker.skills.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {tasker.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                  activeTab === 'reviews'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('reviews')}
              >
                Reviews
              </button>
              
              <button
                className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                  activeTab === 'tasks'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('tasks')}
              >
                Completed Tasks
              </button>
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <TaskerRatingSummary ratings={taskerReviews} />
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Reviews</h3>
                
                {loadingReviews ? (
                  <p className="text-gray-600 text-center py-4">Loading reviews...</p>
                ) : taskerReviews.length > 0 ? (
                  <div className="space-y-4">
                    {taskerReviews.map(review => (
                      <TaskerReview key={review._id} review={review} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Completed Tasks</h3>
            
            {tasker.completedTasks > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {tasker.name} has completed {tasker.completedTasks} tasks.
                </p>
                {/* Task history could be displayed here if available from the API */}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No completed tasks yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskerProfilePage; 