import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { toast } from 'react-toastify';
import api from '../services/api';
import ReviewForm from './ReviewForm';

const TaskCompletion = ({ task, onTaskUpdate }) => {
  const { currentUser, isTasker, isCustomer } = useAuth();
  const { requestCompletion, confirmCompletion, rejectCompletion, addFeedback } = useTasks();
  
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [customerFeedback, setCustomerFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [taskerFeedback, setTaskerFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Check if current user is the assigned tasker for this task
  const isAssignedTasker = task?.assignedTo && currentUser?._id === task.assignedTo._id;
  
  // Check if current user is the customer who posted this task
  const isTaskOwner = currentUser && task?.customer && currentUser._id === task.customer._id;

  // Check if the task already has a review
  useEffect(() => {
    const checkReview = async () => {
      if (isTaskOwner && task?.status === 'completed' && task?.assignedTo) {
        try {
          const response = await api.get(`/reviews/check-review?taskId=${task._id}`);
          setHasReviewed(response.data.hasReviewed);
        } catch (error) {
          console.error('Error checking review:', error);
        }
      }
    };

    checkReview();
  }, [isTaskOwner, task]);

  const handleStartTask = async () => {
    try {
      setIsSubmitting(true);
      await api.put(`/tasks/${task._id}/start`);
      toast.success('Task started successfully!');
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error(error.response?.data?.message || 'Failed to start task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCompletion = async (e) => {
    e.preventDefault();
    if (!completionNote.trim()) {
      toast.error('Please provide a completion note');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestCompletion(task._id, completionNote);
      toast.success('Task completion requested. Waiting for customer confirmation.');
      setShowCompletionForm(false);
      setCompletionNote('');
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error requesting task completion:', error);
      toast.error(error.message || 'Failed to request task completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await confirmCompletion(task._id, customerFeedback);
      toast.success('Task marked as completed successfully.');
      
      // Submit review
      await api.post('/reviews', {
        taskerId: task.assignedTo._id,
        taskId: task._id,
        rating,
        comment: customerFeedback
      });
      toast.success('Review submitted successfully');
      setHasReviewed(true);
      
      setShowConfirmationForm(false);
      setCustomerFeedback('');
      setRating(0);
      // Do not show separate review form
      // setShowReviewForm(true);
      
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error confirming task completion:', error);
      toast.error(error.message || 'Failed to confirm task completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectCompletion = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsSubmitting(true);
      await rejectCompletion(task._id, rejectionReason);
      toast.success('Task completion request rejected.');
      setShowRejectionForm(false);
      setRejectionReason('');
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error rejecting task completion:', error);
      toast.error(error.message || 'Failed to reject task completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!taskerFeedback.trim()) {
      toast.error('Please provide feedback');
      return;
    }

    try {
      setIsSubmitting(true);
      await addFeedback(task._id, taskerFeedback);
      toast.success('Feedback added successfully.');
      setShowFeedbackForm(false);
      setTaskerFeedback('');
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast.error(error.message || 'Failed to add feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setHasReviewed(true);
    toast.success('Thank you for your review!');
    
    // Refresh task details
    if (onTaskUpdate) onTaskUpdate();
  };

  // If no task or user is not related to the task, don't render anything
  if (!task || (!isTaskOwner && !isAssignedTasker)) {
    return null;
  }

  // Render UI based on task status and user role
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Task Completion</h3>
      
      {/* Tasker UI - Start task when assigned */}
      {isAssignedTasker && task.status === 'assigned' && (
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
            <p>This task has been assigned to you. You can now start working on it.</p>
          </div>
          <button
            onClick={handleStartTask}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting...' : 'Start Task'}
          </button>
        </div>
      )}
      
      {/* Tasker UI - Request completion when task is in progress */}
      {isAssignedTasker && task.status === 'inProgress' && (
        <div>
          {!showCompletionForm ? (
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Once you've completed this task, request completion confirmation from the customer.
              </p>
              <button
                onClick={() => setShowCompletionForm(true)}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
              >
                Request Completion
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestCompletion}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="completionNote">
                  Completion Note
                </label>
                <textarea
                  id="completionNote"
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  rows="3"
                  placeholder="Describe how you completed the task..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCompletionForm(false)}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      
      {/* Tasker UI - Waiting for customer confirmation */}
      {isAssignedTasker && task.status === 'completionRequested' && (
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
            <p>
              You've requested completion on {new Date(task.completionRequestedAt).toLocaleDateString()}. 
              Waiting for customer confirmation.
            </p>
          </div>
          <p className="text-gray-700">
            The customer will review your work and confirm the task completion.
          </p>
        </div>
      )}
      
      {/* Customer UI - Task completion requested */}
      {isTaskOwner && task.status === 'completionRequested' && (
        <div>
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
            <p className="font-semibold">The tasker has marked this task as completed</p>
            <p className="mt-2">
              {task.completionNote}
            </p>
            <p className="mt-2 text-sm">
              Requested on: {new Date(task.completionRequestedAt).toLocaleDateString()}
            </p>
          </div>
          
          {!showConfirmationForm && !showRejectionForm && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowConfirmationForm(true)}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
              >
                Confirm Completion
              </button>
              <button
                onClick={() => setShowRejectionForm(true)}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
              >
                Reject Completion
              </button>
            </div>
          )}
          
          {showConfirmationForm && (
            <form onSubmit={handleConfirmCompletion}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rating (Required)
                </label>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, index) => {
                    const starRating = index + 1;
                    return (
                      <button
                        key={starRating}
                        type="button"
                        onClick={() => setRating(starRating)}
                        onMouseEnter={() => setHoveredRating(starRating)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style={{ color: starRating <= (hoveredRating || rating) ? '#FFD700' : '#D1D5DB' }}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784 .57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81 .588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerFeedback">
                  Review (Optional)
                </label>
                <textarea
                  id="customerFeedback"
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  rows="3"
                  placeholder="Provide any feedback about the task completion..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmationForm(false)}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          )}
          
          {showRejectionForm && (
            <form onSubmit={handleRejectCompletion}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rejectionReason">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  placeholder="Explain why you're rejecting the task completion..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRejectionForm(false)}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject Completion'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      
      {/* Customer UI - Task completed */}
      {isTaskOwner && task.status === 'completed' && (
        <div>
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
            <p className="font-semibold">Task completed successfully!</p>
            <p className="mt-2 text-sm">
              Completed on: {new Date(task.completedAt).toLocaleDateString()}
            </p>
          </div>
          
          {!hasReviewed && !showReviewForm && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Leave a Review
              </button>
            </div>
          )}
          
          {showReviewForm && (
            <ReviewForm
              taskId={task._id}
              taskerId={task.assignedTo._id}
              taskerName={task.assignedTo.name}
              onSubmitSuccess={handleReviewSubmitted}
            />
          )}
          
          {hasReviewed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center text-blue-800">
              You have already reviewed this task. Thank you for your feedback!
            </div>
          )}
        </div>
      )}
      
      {/* Tasker UI - Task completed */}
      {isAssignedTasker && task.status === 'completed' && (
        <div>
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
            <p className="font-semibold">Task completed successfully!</p>
            <p className="mt-2 text-sm">
              Completed on: {new Date(task.completedAt).toLocaleDateString()}
            </p>
            
            {task.customerFeedback && (
              <div className="mt-3 p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-gray-600">Customer Feedback:</p>
                <p className="text-sm text-gray-800">{task.customerFeedback}</p>
              </div>
            )}
          </div>
          
          {!task.taskerFeedback && !showFeedbackForm && (
            <div className="text-center">
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Add Your Feedback
              </button>
            </div>
          )}
          
          {showFeedbackForm && (
            <form onSubmit={handleAddFeedback}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taskerFeedback">
                  Your Feedback
                </label>
                <textarea
                  id="taskerFeedback"
                  value={taskerFeedback}
                  onChange={(e) => setTaskerFeedback(e.target.value)}
                  rows="3"
                  placeholder="Share your experience working on this task..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
          
          {task.taskerFeedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-gray-600">Your Feedback:</p>
              <p className="text-gray-800 mt-1">{task.taskerFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCompletion;