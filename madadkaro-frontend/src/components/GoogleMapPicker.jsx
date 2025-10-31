import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Map, Marker } from 'react-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map } from '@vis.gl/react-maplibre';
import YouAreHere from '../components/you-are-here';
import { middleOfUSA } from '../lib/constants';


const containerStyle = {
  width: '100%',
  height: '300px'
};

const GoogleMapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const [position, setPosition] = useState(initialLocation || { lat: 22.3072, lng: 72.1833 }); // Default to middle of Gujarat
  const [userLocation, setUserLocation] = useState(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    console.log('MapLibre GL Map loaded');
    // Attempt to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(newPos);
          setPosition(newPos);
          onLocationSelect(newPos);
          map.flyTo({ center: [newPos.lng, newPos.lat], zoom: 13 });
        },
        (err) => {
          console.error("Error getting current location:", err);
          // Fallback to IP-based location or default if geolocation fails
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                const ipPos = { lat: data.latitude, lng: data.longitude };
                setUserLocation(ipPos);
                setPosition(ipPos);
                onLocationSelect(ipPos);
                map.flyTo({ center: [ipPos.lng, ipPos.lat], zoom: 13 });
              }
            })
            .catch(error => console.error("Error fetching IP location:", error));
        }
      );
    }
  }, [onLocationSelect]);

  const onMapClick = useCallback((map, event) => {
    const { lng, lat } = event.lngLat;
    setPosition({ lat, lng });
    onLocationSelect({ lat, lng });
  }, [onLocationSelect]);

  const handleMarkerDragEnd = useCallback((marker) => {
    const { lng, lat } = marker.lngLat;
    setPosition({ lat, lng });
    onLocationSelect({ lat, lng });
  }, [onLocationSelect]);

  const findMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(newPos);
          setPosition(newPos);
          onLocationSelect(newPos);
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [newPos.lng, newPos.lat], zoom: 13 });
          }
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
    <div style={containerStyle}>
      <Map
        initialViewState={{
          longitude: middleOfUSA[0],
          latitude: middleOfUSA[1],
          zoom: 2
        }}
        // mapStyle="/styles/dark.json"
        mapStyle="https://tiles.openfreemap.org/styles/liberty">
        <YouAreHere />
      </Map>
      <button
        className="absolute top-2 left-2 z-10 p-2 bg-white rounded-md shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={findMyLocation}
        title="Find My Location"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.727A8 8 0 016.343 7.273L7.273 6.343a8 8 0 0111.314 11.314l-.93.93zM6.343 7.273L5.414 6.343a8 8 0 0011.314 11.314l.93-.93A8 8 0 006.343 7.273z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-6m0 0V6m0 6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
};

export default GoogleMapPicker;