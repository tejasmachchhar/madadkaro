import { Link } from 'react-router-dom';

const CategoryCard = ({ category, locationData, isPopular = false, userRole = 'tasker' }) => { // Added userRole prop with default
  const { _id, name, icon, priceRange, slug } = category; // Added slug for consistency if needed
  // console.log('category: '+category);
  
  // Generate URL with location parameters if available
  const generateUrl = () => {
    const params = new URLSearchParams();
    
    if (userRole === 'customer') {
      params.append('category', slug || _id); // Use slug if available, otherwise _id
      return `/post-task?${params.toString()}`;
    }
    
    // Default to tasker behavior (or any other role)
    params.append('category', slug || _id); // Use slug if available, otherwise _id
    
    if (locationData) {
      params.append('location', locationData.address);
      if (locationData.lat && locationData.lng) {
        params.append('lat', locationData.lat);
        params.append('lng', locationData.lng);
      }
    }
    
    return `/tasks?${params.toString()}`;
  };
  
  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  return (
    <Link 
      to={generateUrl()}
      className={`relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden
        ${isPopular ? 'ring-2 ring-secondary-500' : ''}`}
    >
      {isPopular && (
        <div className="bg-secondary-500 text-white text-xs font-bold px-3 py-1 absolute right-0 top-0 rounded-bl-lg">
          POPULAR
        </div>
      )}
      
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        
        {priceRange && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-1">Estimated Price Range:</p>
            <p className="font-medium text-primary-700">
              {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            Select Task
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;