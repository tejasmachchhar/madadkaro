const getBidPopulateFields = (isPrivileged) => {
  return isPrivileged 
    ? 'name email profilePicture avgRating totalReviews hourlyRate'
    : 'name profilePicture avgRating totalReviews hourlyRate';
};

module.exports = { getBidPopulateFields };