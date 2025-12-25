import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Marker, useMap } from '@vis.gl/react-maplibre';
import YouAreHere from '../components/you-are-here';
import { middleOfIndia } from '../lib/constants';


const containerStyle = {
  width: '100%',
  height: '300px'
};

// Internal component to access map instance
const MapController = forwardRef((props, ref) => {
  const { current: map } = useMap();
  
  useImperativeHandle(ref, () => ({
    flyTo: (options) => {
      if (map) {
        map.flyTo(options);
      }
    }
  }));
  
  return null;
});

MapController.displayName = 'MapController';

const GoogleMapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapControllerRef = useRef(null);
  const [position, setPosition] = useState(initialLocation || { lat: 22.3072, lng: 72.1833 });

  // Update marker position when initialLocation changes
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setPosition(initialLocation);
    }
  }, [initialLocation]);

  // Callback to update marker position when YouAreHere finds location
  const handleLocationFound = useCallback((location) => {
    setPosition(location);
    onLocationSelect(location);
  }, [onLocationSelect]);

  const onMapClick = useCallback((event) => {
    const { lng, lat } = event.lngLat;
    const newPos = { lat, lng };
    setPosition(newPos);
    onLocationSelect(newPos);
  }, [onLocationSelect]);

  const handleMarkerDragEnd = useCallback((event) => {
    const { lng, lat } = event.lngLat;
    const newPos = { lat, lng };
    setPosition(newPos);
    onLocationSelect(newPos);
  }, [onLocationSelect]);

  const findMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          // Fly to location with smooth animation first
          if (mapControllerRef.current) {
            mapControllerRef.current.flyTo({ 
              center: [newPos.lng, newPos.lat], 
              zoom: 13,
              duration: 2000
            });
          }
          // Update marker position after flyTo animation has started
          setTimeout(() => {
            setPosition(newPos);
            onLocationSelect(newPos);
          }, 100);
        },
        (err) => {
          console.error("Error getting current location:", err);
          alert("Could not retrieve your current location. Please ensure location services are enabled.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div style={containerStyle} className="relative">
      <Map
        initialViewState={{
          longitude: (initialLocation?.lng) ?? middleOfIndia[0],
          latitude: (initialLocation?.lat) ?? middleOfIndia[1],
          zoom: initialLocation ? 12 : 2
        }}
        onClick={onMapClick}
        mapStyle="https://tiles.openfreemap.org/styles/liberty">
        <MapController ref={mapControllerRef} />
        <Marker longitude={position.lng} latitude={position.lat} draggable onDragEnd={handleMarkerDragEnd} />
        <YouAreHere onLocationFound={handleLocationFound} />
      </Map>
      <button
        className="absolute top-2 left-2 z-10 p-2 bg-white rounded-md shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); findMyLocation(); }}
        title="Find My Location"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </svg>
      </button>
    </div>
  );
};

export default GoogleMapPicker;