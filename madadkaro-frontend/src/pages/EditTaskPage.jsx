import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { toast } from 'react-toastify';
import api from '../services/api';
import CategorySelect from '../components/CategorySelect';

const EditTaskPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { taskDetail, taskDetailLoading, getTaskDetail, editTask } = useTasks();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    budget: '',
    address: '',
    dateRequired: '',
    timeRequired: '',
    duration: '',
    isUrgent: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  
  useEffect(() => {
    getTaskDetail(taskId);
  }, [taskId, getTaskDetail]);
  
  useEffect(() => {
    if (taskDetail) {
      // Pre-fill form with existing task data
      setFormData({
        title: taskDetail.title || '',
        description: taskDetail.description || '',
        category: taskDetail.category?._id || '',
        subcategory: taskDetail.subcategory?._id || '',
        budget: taskDetail.budget || '',
        address: taskDetail.address || '',
        dateRequired: taskDetail.dateRequired ? new Date(taskDetail.dateRequired).toISOString().split('T')[0] : '',
        timeRequired: taskDetail.timeRequired || '',
        duration: taskDetail.duration || '',
        isUrgent: taskDetail.isUrgent || false
      });
      
      setExistingImages(taskDetail.images || []);
    }
  }, [taskDetail]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId,
      subcategory: '' // Reset subcategory when category changes
    }));
  };
  
  const handleSubcategoryChange = (subcategoryId) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: subcategoryId
    }));
  };
  
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };
  
  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate the form data
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }
      if (!formData.subcategory) {
        throw new Error('Subcategory is required');
      }
      
      const taskFormData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          taskFormData.append(key, formData[key]);
        }
      });
      
      // Append existing images as a JSON string
      if (existingImages.length > 0) {
        taskFormData.append('existingImages', JSON.stringify(existingImages));
      }
      
      // Append new images
      selectedImages.forEach(image => {
        taskFormData.append('images', image);
      });
      
      // Send the request
      await editTask(taskId, taskFormData);
      
      toast.success('Task updated successfully!');
      navigate(`/tasks/${taskId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update task';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Task</h1>
        
        {taskDetailLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading task details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Title*</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Fix leaking kitchen faucet"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="5"
                  placeholder="Describe your task in detail. Include what needs to be done, when, where, and any specific requirements."
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategorySelect 
                  selectedCategory={formData.category}
                  selectedSubcategory={formData.subcategory}
                  onCategoryChange={handleCategoryChange}
                  onSubcategoryChange={handleSubcategoryChange}
                />
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Budget (₹)*</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your budget"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Location*</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task location"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Date Required</label>
                  <input
                    type="date"
                    name="dateRequired"
                    value={formData.dateRequired}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Time Required</label>
                  <input
                    type="time"
                    name="timeRequired"
                    value={formData.timeRequired}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Duration (in hours)*</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Estimated duration in hours"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Images</label>
                <div className="space-y-4">
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {existingImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Task image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, true)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images */}
                  {selectedImages.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">New Images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`New image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      You can select multiple images. Maximum file size: 5MB per image.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isUrgent"
                name="isUrgent"
                checked={formData.isUrgent}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isUrgent" className="ml-2 text-gray-700">
                This is an urgent task
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(`/tasks/${taskId}`)}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition order-2 sm:order-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition order-1 sm:order-2"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTaskPage; 