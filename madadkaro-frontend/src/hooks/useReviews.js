import { useState, useCallback } from 'react';
import api from '../services/api';

export const useReviews = () => {
  const [taskerReviews, setTaskerReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);

  // Get reviews for a specific tasker
  const getTaskerReviews = useCallback(async (taskerId) => {
    setLoadingReviews(true);
    try {
      const response = await api.get(`/reviews/tasker/${taskerId}`);
      setTaskerReviews(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasker reviews:', error);
      throw error;
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // Get reviews written by the current user
  const getMyReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const response = await api.get('/reviews/my-reviews');
      setMyReviews(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      throw error;
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // Get reviews received by the current user (if tasker)
  const getMyReceivedReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const response = await api.get('/reviews/received');
      console.log('API response for received reviews:', response.data);
      setTaskerReviews(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching received reviews:', error);
      throw error;
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // Submit a review
  const submitReview = useCallback(async (reviewData) => {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }, []);

  // Get stats for a tasker's reviews
  const getTaskerReviewStats = useCallback(async (taskerId) => {
    try {
      const response = await api.get(`/reviews/stats/${taskerId}`);
      setReviewStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }, []);

  // Get my review stats (if tasker)
  const getMyReviewStats = useCallback(async () => {
    try {
      const response = await api.get('/reviews/my-stats');
      setReviewStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching my review stats:', error);
      throw error;
    }
  }, []);

  return {
    taskerReviews,
    myReviews,
    loadingReviews,
    reviewStats,
    getTaskerReviews,
    getMyReviews,
    getMyReceivedReviews,
    submitReview,
    getTaskerReviewStats,
    getMyReviewStats
  };
}; 