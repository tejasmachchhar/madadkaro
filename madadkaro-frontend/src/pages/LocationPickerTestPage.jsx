import { useState } from 'react';
import LocationPicker from '../components/LocationPicker';

const LocationPickerTestPage = () => {
  const [location, setLocation] = useState(null);

  const handleLocationSelect = (locationData) => {
    setLocation(locationData);
    console.log('Selected location:', locationData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Location Picker Test</h1>
        
        <div className="mb-8">
          <LocationPicker 
            onLocationSelect={handleLocationSelect}
            initialLocation={{ lat: 28.6139, lng: 77.2090 }} 
            height="500px"
          />
        </div>
        
        {location && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Selected Location:</h2>
            <p><strong>Address:</strong> {location.address}</p>
            <p><strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerTestPage; 