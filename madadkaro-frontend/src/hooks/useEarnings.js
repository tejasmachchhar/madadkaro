import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

/**
 * Custom hook for managing tasker earnings data
 * @returns {Object} Earnings data and methods
 */
export const useEarnings = () => {
  const { currentUser, isTasker } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch earnings data
  const fetchEarnings = async () => {
    if (!isTasker || !currentUser?._id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/users/earnings');
      setEarnings(response.data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err.response?.data?.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh earnings data
  const refreshEarnings = () => {
    fetchEarnings();
  };

  // Auto-fetch earnings when user is authenticated as tasker
  useEffect(() => {
    if (isTasker && currentUser?._id) {
      fetchEarnings();
    } else {
      setEarnings(null);
    }
  }, [isTasker, currentUser?._id]);

  return {
    earnings,
    loading,
    error,
    refreshEarnings,
    // Computed values for convenience
    todayEarnings: earnings?.today?.earnings || 0,
    todayTasksCount: earnings?.today?.tasksCompleted || 0,
    todayProgress: earnings?.today?.progress || 0,
    todayTarget: earnings?.today?.target || 1000,
    todayTargetAchieved: earnings?.today?.targetAchieved || false,
    weekEarnings: earnings?.week?.earnings || 0,
    weekProgress: earnings?.week?.progress || 0,
    weekTarget: earnings?.week?.target || 5000,
    weekTargetAchieved: earnings?.week?.targetAchieved || false,
    totalEarnings: earnings?.total?.earnings || 0,
    totalTasksCompleted: earnings?.total?.tasksCompleted || 0,
    activeTasksCount: earnings?.activeTasks?.count || 0,
    potentialEarnings: earnings?.activeTasks?.potentialEarnings || 0,
    motivation: earnings?.motivation || {},
  };
};
