import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { toast } from 'react-toastify';

const TaskCompletionButton = ({ taskId, onComplete }) => {
  const { requestCompletion } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => setIsOpen(true);
  const handleCloseModal = () => {
    setIsOpen(false);
    setCompletionNote('');
  };

  const handleRequestCompletion = async (e) => {
    e.preventDefault();
    if (!completionNote.trim()) {
      toast.error('Please provide a completion note');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestCompletion(taskId, completionNote);
      toast.success('Task completion requested. Waiting for customer confirmation.');
      handleCloseModal();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error requesting task completion:', error);
      toast.error(error.message || 'Failed to request task completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
      >
        Mark Completed
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Request Task Completion</h3>
            
            <form onSubmit={handleRequestCompletion}>
              <div className="mb-4">
                <label htmlFor="completionNote" className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Note
                </label>
                <textarea
                  id="completionNote"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe how you completed the task..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  required
                ></textarea>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskCompletionButton; 