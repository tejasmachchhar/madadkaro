import React from 'react';

const TaskerRatingSummary = ({ ratings }) => {
  // Calculate average rating
  const calculateAverage = () => {
    if (!ratings || ratings.length === 0) return 0;
    
    console.log('TaskerRatingSummary - Calculating average for ratings:', ratings);
    
    const sum = ratings.reduce((total, rating) => {
      // Check which property contains the rating value
      const ratingValue = rating.rating || (rating.stars ? rating.stars : 0);
      console.log('Rating value:', ratingValue);
      return total + ratingValue;
    }, 0);
    
    return (sum / ratings.length).toFixed(1);
  };
  
  // Count ratings by star
  const getRatingCounts = () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (ratings && ratings.length > 0) {
      ratings.forEach(review => {
        const ratingValue = review.rating || (review.stars ? review.stars : 0);
        counts[ratingValue] = (counts[ratingValue] || 0) + 1;
      });
    }
    
    return counts;
  };
  
  const renderStars = (rating) => {
    const stars = [];
    const ratingValue = parseFloat(rating);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingValue) {
        // Full star
        stars.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i - 0.5 <= ratingValue) {
        // Half star - not implemented in this simplified version
        stars.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        // Empty star
        stars.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    
    return stars;
  };
  
  const averageRating = calculateAverage();
  const ratingCounts = getRatingCounts();
  const totalRatings = ratings ? ratings.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Rating Summary</h3>
      
      <div className="flex items-center mb-6">
        <div className="text-4xl font-bold mr-3">{averageRating}</div>
        <div className="flex items-center">
          <div className="flex mr-2">
            {renderStars(averageRating)}
          </div>
          <div className="text-sm text-gray-600">
            {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>
      
      {/* Rating distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(star => {
          const count = ratingCounts[star] || 0;
          const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
          
          return (
            <div key={star} className="flex items-center">
              <div className="flex items-center w-20">
                <span className="text-sm mr-1">{star}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              
              <div className="flex-1 mx-2">
                <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 w-14 text-right">
                {count} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskerRatingSummary; 