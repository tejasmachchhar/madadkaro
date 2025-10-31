import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPosition, getAddressFromCoordinates } from '../utils/locationUtils';
import { toast } from 'react-toastify';

/**
 * LocationSearch component
 * Provides a search box with current location button for searching locations
 */
const LocationSearch = ({ 
  onLocationSelect, 
  placeholder = "Enter location...",
  buttonText = "Search",
  navigateTo = null,
  queryParam = "location",
  className = "",
  showCurrentLocationButton = true,
  defaultValue = "",
  autoFocus = false
}) => {
  const [location, setLocation] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    if (onLocationSelect) {
      onLocationSelect(location);
    }

    if (navigateTo) {
      navigate(`${navigateTo}?${queryParam}=${encodeURIComponent(location)}`);
    }
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      const position = await getCurrentPosition();
      const address = await getAddressFromCoordinates(position.lat, position.lng);
      
      setLocation(address);
      
      if (onLocationSelect) {
        onLocationSelect({
          address,
          lat: position.lat,
          lng: position.lng
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error('Could not get your location. Please check your browser permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-400 text-primary-900"
          ref={inputRef}
        />
        
        {showCurrentLocationButton && (
          <button 
            type="button" 
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="absolute right-20 text-gray-500 hover:text-primary-600 transition-colors"
            title="Use current location"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
        
        <button 
          type="submit" 
          className="bg-secondary-600 hover:bg-secondary-700 px-6 py-3 rounded-r-md transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};

export default LocationSearch; 