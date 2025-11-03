import React, { useState, useRef, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Marker, useMap } from '@vis.gl/react-maplibre';
import YouAreHere from '../components/you-are-here';
import { middleOfUSA } from '../lib/constants';


const containerStyle = {
  width: '100%',
  height: '300px'
};

const GoogleMapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const { current: map } = useMap();
  const [position, setPosition] = useState(initialLocation || { lat: 22.3072, lng: 72.1833 });

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
          setPosition(newPos);
          onLocationSelect(newPos);
          if (map) map.flyTo({ center: [newPos.lng, newPos.lat], zoom: 13 });
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
          longitude: (initialLocation?.lng) ?? middleOfUSA[0],
          latitude: (initialLocation?.lat) ?? middleOfUSA[1],
          zoom: initialLocation ? 12 : 2
        }}
        onClick={onMapClick}
        mapStyle="https://tiles.openfreemap.org/styles/liberty">
        <Marker longitude={position.lng} latitude={position.lat} draggable onDragEnd={handleMarkerDragEnd} />
        <YouAreHere />
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