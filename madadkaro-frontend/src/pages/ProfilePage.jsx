import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useReviews } from '../hooks/useReviews';
import { toast } from 'react-toastify';
import TaskerRatingSummary from '../components/TaskerRatingSummary';
import TaskerReview from '../components/TaskerReview';

const ProfilePage = () => {
  const { currentUser, updateProfile } = useAuth();
  const { taskerReviews, loadingReviews, getMyReceivedReviews, reviewStats, getMyReviewStats } = useReviews();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bio: '',
    skills: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [taskerRating, setTaskerRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        password: '',
        confirmPassword: '',
        bio: currentUser.bio || '',
        skills: currentUser.skills ? currentUser.skills.join(', ') : ''
      });

      // Fetch reviews if user is a tasker
      if (currentUser.role === 'tasker') {
        getMyReceivedReviews().then(reviews => {
          console.log('Tasker Reviews:', reviews);
          // Calculate rating directly from reviews
          if (reviews && reviews.length > 0) {
            const sum = reviews.reduce((total, review) => {
              // Handle different review object structures
              return total + (review.rating || review.stars || 0);
            }, 0);
            setTaskerRating(sum / reviews.length);
            setReviewCount(reviews.length);
          }
        });
        getMyReviewStats();
      }
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updatedData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()) : []
      };
      
      // Only include password if it's being changed
      if (formData.password) {
        updatedData.password = formData.password;
      }
      
      await updateProfile(updatedData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          {!isEditing && activeTab === 'profile' && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Tabs for taskers */}
        {currentUser && currentUser.role === 'tasker' && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('profile')}
                >
                  Profile
                </button>
                
                <button
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    activeTab === 'reviews'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('reviews')}
                >
                  Reviews & Ratings
                </button>
              </nav>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    ></textarea>
                  </div>
                  
                  {currentUser && currentUser.role === 'tasker' && (
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">Skills (comma separated)</label>
                      <input
                        type="text"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Plumbing, Electrical, Carpentry"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-gray-600 font-medium">Full Name</h3>
                    <p className="text-gray-900">{currentUser?.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-gray-600 font-medium">Email</h3>
                    <p className="text-gray-900">{currentUser?.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-gray-600 font-medium">Phone Number</h3>
                    <p className="text-gray-900">{currentUser?.phone || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-gray-600 font-medium">User Role</h3>
                    <p className="text-gray-900 capitalize">{currentUser?.role}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-gray-600 font-medium">Bio</h3>
                  <p className="text-gray-900">{currentUser?.bio || 'No bio provided'}</p>
                </div>
                
                {currentUser && currentUser.role === 'tasker' && (
                  <div>
                    <h3 className="text-gray-600 font-medium">Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentUser.skills && currentUser.skills.length > 0 ? (
                        currentUser.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-900">No skills listed</p>
                      )}
                    </div>
                  </div>
                )}
                
                {currentUser && currentUser.role === 'tasker' && (
                  <div>
                    <div className="flex items-center mt-2">
                      <h3 className="text-gray-600 font-medium mr-2">Overall Rating:</h3>
                      {((currentUser.totalReviews > 0) || (taskerReviews && taskerReviews.length > 0) || (reviewCount > 0)) ? (
                        <div className="flex items-center">
                          <span className="text-xl font-medium text-yellow-500 mr-1">
                            {reviewCount > 0 
                              ? taskerRating.toFixed(1)
                              : taskerReviews && taskerReviews.length > 0 
                                ? (() => {
                                    const sum = taskerReviews.reduce((total, review) => 
                                      total + (review.rating || review.stars || 0), 0);
                                    return (sum / taskerReviews.length).toFixed(1);
                                  })()
                                : currentUser.avgRating 
                                  ? currentUser.avgRating.toFixed(1) 
                                  : '0.0'}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-500 ml-1">
                            ({reviewCount || currentUser.totalReviews || taskerReviews?.length || 0} {(reviewCount || currentUser.totalReviews || taskerReviews?.length || 0) === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No ratings yet</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews and Ratings Tab - Only visible for taskers */}
        {activeTab === 'reviews' && currentUser && currentUser.role === 'tasker' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <TaskerRatingSummary ratings={taskerReviews} />
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">My Reviews</h3>
                
                {loadingReviews ? (
                  <p className="text-gray-600 text-center py-4">Loading reviews...</p>
                ) : taskerReviews && taskerReviews.length > 0 ? (
                  <div className="space-y-4">
                    {taskerReviews.map(review => (
                      <TaskerReview key={review._id} review={review} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">You haven't received any reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 