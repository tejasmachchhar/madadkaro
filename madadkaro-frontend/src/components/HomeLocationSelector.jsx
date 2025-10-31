import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCurrentPosition, getAddressFromCoordinates } from '../utils/locationUtils';

const HomeLocationSelector = ({ onLocationSelect, initialLocation = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState(initialLocation);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(!!initialLocation);

  // Load saved location from localStorage on initial render
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocationData(parsedLocation);
        setLocation(parsedLocation.address);
        setIsLocationConfirmed(true);
        // Only notify parent if we have a callback and the location is different
        if (onLocationSelect && (!initialLocation || JSON.stringify(initialLocation) !== JSON.stringify(parsedLocation))) {
          onLocationSelect(parsedLocation);
        }
      } catch (error) {
        console.error('Failed to parse saved location:', error);
        localStorage.removeItem('userLocation');
      }
    }
  }, []); // Empty dependency array since we only want this to run once on mount

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      const position = await getCurrentPosition();
      const address = await getAddressFromCoordinates(position.lat, position.lng);
      
      const newLocationData = {
        address,
        lat: position.lat,
        lng: position.lng
      };
      
      setLocation(address);
      setLocationData(newLocationData);
      
      // Save location to localStorage
      localStorage.setItem('userLocation', JSON.stringify(newLocationData));
      
      // Pass location data up to parent
      if (onLocationSelect) {
        onLocationSelect(newLocationData);
      }
      
      setIsLocationConfirmed(true);
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error('Could not get your location. Please check your browser permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLocationChange = (e) => {
    setLocation(e.target.value);
    setIsLocationConfirmed(false);
    if (locationData) {
      setLocationData(null);
    }
  };

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }
    
    // For manually entered locations without coordinates
    const newLocationData = {
      address: location,
      lat: null,
      lng: null
    };
    
    setLocationData(newLocationData);
    
    // Save to localStorage
    localStorage.setItem('userLocation', JSON.stringify(newLocationData));
    
    // Pass to parent
    if (onLocationSelect) {
      onLocationSelect(newLocationData);
    }
    
    setIsLocationConfirmed(true);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">Select Your Location</h3>
      
      <form onSubmit={handleLocationSubmit} className="flex flex-col gap-3">
        <div className="relative flex">
          <input
            type="text"
            value={location}
            onChange={handleManualLocationChange}
            placeholder="Enter your city or area"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-400"
            required
          />
          
          <button 
            type="button" 
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="absolute right-20 top-3 text-gray-500 hover:text-primary-600 transition-colors"
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
          
          <button 
            type="submit"
            disabled={isLoading || (isLocationConfirmed && locationData?.address === location)}
            className={`px-6 py-3 rounded-r-md transition-colors ${
              isLocationConfirmed && locationData?.address === location
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {isLocationConfirmed && locationData?.address === location ? 'Confirmed' : 'Confirm'}
          </button>
        </div>
        
        {isLocationConfirmed && (
          <div className="text-sm text-green-600 flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Location confirmed. You'll see tasks in this area.
          </div>
        )}
      </form>
    </div>
  );
};

export default HomeLocationSelector; 