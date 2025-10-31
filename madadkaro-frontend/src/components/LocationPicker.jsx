import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Icon } from 'leaflet';
import { getAddressFromCoordinates, getCurrentPosition } from '../utils/locationUtils';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Add custom CSS for the coordinates tooltip
const tooltipStyle = `
  .coordinate-tooltip {
    background: rgba(0, 0, 0, 0.8);
    border: none;
    border-radius: 4px;
    color: white;
    font-family: monospace;
    font-size: 12px;
    padding: 4px 8px;
    white-space: nowrap;
  }
  .coordinate-tooltip:before {
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`;

// Make sure marker icons render properly in React
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Define a larger, more visible current location icon
const currentLocationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Define a draggable marker icon with a different color to indicate it can be moved
const draggableIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Simple loading indicator component
const LoadingIndicator = () => (
  <div className="flex items-center justify-center w-full h-full bg-gray-100 bg-opacity-75">
    <div className="text-center">
      <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-gray-600">Loading map...</p>
    </div>
  </div>
);

// Current location button component
const CurrentLocationButton = ({ onClick, loading }) => (
  <button 
    onClick={onClick}
    className="absolute z-400 bottom-5 right-5 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700"
    disabled={loading}
  >
    {loading ? (
      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}
  </button>
);

// Main LocationPicker component
const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation = { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
  height = '400px',
  showSearchBar = false,
  showCurrentLocationButton = true,
  zoom = 13,
  onError = null
}) => {
  // Normalize initial location to ensure it's valid
  const safeInitialLocation = useMemo(() => {
    if (!initialLocation || typeof initialLocation.lat !== 'number' || typeof initialLocation.lng !== 'number') {
      return { lat: 28.6139, lng: 77.2090 }; // Default to Delhi
    }
    return initialLocation;
  }, [initialLocation]);
  
  // State for location and UI
  const [position, setPosition] = useState(safeInitialLocation);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  
  // Refs for component mount state and map instance
  const isMounted = useRef(true);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);  // Add a ref for the marker
  
  // Lazily load the map components to avoid SSR issues
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  // Inject custom CSS for tooltips
  useEffect(() => {
    // Create style element
    const style = document.createElement('style');
    style.textContent = tooltipStyle;
    style.id = 'coordinate-tooltip-style';
    
    // Check if style already exists
    if (!document.getElementById('coordinate-tooltip-style')) {
      document.head.appendChild(style);
    }
    
    // Clean up on unmount
    return () => {
      const existingStyle = document.getElementById('coordinate-tooltip-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  // Helper function to get address from coordinates - MOVED UP before being used in dependencies
  const loadAddress = useCallback(async (lat, lng) => {
    try {
      if (lat && lng) {
        const addressResult = await getAddressFromCoordinates(lat, lng);
        
        if (isMounted.current) {
          setAddress(addressResult);
        }
      }
    } catch (error) {
      console.error('Error loading address:', error);
      if (isMounted.current) {
        setAddress(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setShowManualEntry(true);
      }
    }
  }, []);
  
  // Ensure we load leaflet dynamically to avoid SSR issues
  useEffect(() => {
    let isCancelled = false;
    
    const loadLeaflet = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        // Import with integrity checks to ensure proper loading
        const L = await import('leaflet');
        const ReactLeaflet = await import('react-leaflet');
        const GeoSearch = await import('leaflet-geosearch');
        
        if (isCancelled) return;
        
        // Store references
        leafletRef.current = {
          L,
          ReactLeaflet,
          GeoSearch,
          OpenStreetMapProvider: GeoSearch.OpenStreetMapProvider,
          SearchControl: GeoSearch.SearchControl
        };
        
        // Force reload CSS to ensure proper styling
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(link);
        
        setLeafletLoaded(true);
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        setMapError(true);
        setMapLoading(false);
        if (onError) onError(error);
      }
    };
    
    loadLeaflet();
    
    return () => {
      isCancelled = true;
    };
  }, [onError]);
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Clean up any map instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, []);
  
  // Handle map initialization
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInitialized) return;
    
    try {
      // Clear any existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      const { L } = leafletRef.current;
      
      // Create the map instance directly using Leaflet instead of React-Leaflet
      const map = L.map(mapContainerRef.current, {
        center: [position.lat, position.lng],
        zoom: zoom,
        zoomControl: true
      });
      
      // Add tile layer with retry mechanism
      const addTileLayer = (retryCount = 0) => {
        try {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: ['a', 'b', 'c'],
            maxZoom: 19
          }).addTo(map);
        } catch (error) {
          console.error('Error adding tile layer:', error);
          if (retryCount < 3) {
            setTimeout(() => addTileLayer(retryCount + 1), 1000);
          }
        }
      };
      
      addTileLayer();
      
      // Add marker and store reference
      const marker = L.marker([position.lat, position.lng], { 
        icon: customIcon,
        draggable: true  // Make the marker draggable
      }).addTo(map);
      markerRef.current = marker;
      
      // Add drag event handlers
      marker.on('dragstart', () => {
        // Change the icon when dragging starts to provide visual feedback
        marker.setIcon(draggableIcon);
      });

      // Add a drag event to show coordinates in real-time
      marker.on('drag', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        
        // Show coordinates while dragging in a tooltip
        marker.bindTooltip(
          `Lat: ${position.lat.toFixed(6)}<br>Lng: ${position.lng.toFixed(6)}`,
          { permanent: true, direction: 'top', className: 'coordinate-tooltip' }
        ).openTooltip();
      });

      marker.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        
        // Close the tooltip that was showing coordinates
        marker.closeTooltip();
        
        handleMapClick(position);
        
        // Add visual indicator for the new position with a small popup
        marker.bindPopup("Location updated! ✓").openPopup();
        
        // Close the popup after 2 seconds
        setTimeout(() => {
          if (marker && marker.isPopupOpen()) {
            marker.closePopup();
          }
        }, 2000);
      });
      
      // Add click handler
      map.on('click', (e) => {
        handleMapClick(e.latlng);
      });
      
      // Store the map instance
      mapInstanceRef.current = map;
      setMapInitialized(true);
      setMapLoading(false);
      
      // Initialize address data
      loadAddress(position.lat, position.lng);
      
      // Force a resize event to ensure map renders correctly
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 100);
      
      // Add a draggable hint when marker is first added
      setTimeout(() => {
        marker.bindPopup("Drag this marker to adjust location precisely").openPopup();
        setTimeout(() => marker.closePopup(), 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
      setMapLoading(false);
      if (onError) onError(error);
    }
  }, [leafletLoaded, zoom, onError, mapInitialized, position.lat, position.lng]); // Removed loadAddress from dependencies
  
  // Update map view when position changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapInitialized || !markerRef.current) return;
    
    try {
      // Update marker position using the reference
      markerRef.current.setLatLng([position.lat, position.lng]);
      
      // If the marker was previously made draggable, maintain that state
      if (markerRef.current.dragging) {
        markerRef.current.dragging.enable();
      }
      
      // Pan map to new position with animation
      mapInstanceRef.current.panTo([position.lat, position.lng], {
        animate: true,
        duration: 0.5
      });
      
      // Make sure map is properly sized
      mapInstanceRef.current.invalidateSize();
      
    } catch (error) {
      console.error('Error updating map view:', error);
    }
  }, [position, mapInitialized]);
  
  // Notify parent component when position or address changes
  useEffect(() => {
    if (onLocationSelect && position.lat && position.lng) {
      onLocationSelect({
        lat: position.lat,
        lng: position.lng,
        address: address || manualAddress || `Location at ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
      });
    }
  }, [position, address, manualAddress, onLocationSelect]);
  
  // Handle map click
  const handleMapClick = useCallback((latlng) => {
    if (!isMounted.current) return;
    
    const newPosition = { 
      lat: latlng.lat || latlng.latitude || latlng.y, 
      lng: latlng.lng || latlng.longitude || latlng.x 
    };
    
    setPosition(newPosition);
    setAccuracy(null);
    
    // Get address for the new position
    loadAddress(newPosition.lat, newPosition.lng);
  }, [loadAddress]);
  
  // Handle manual address change
  const handleManualAddressChange = useCallback((e) => {
    setManualAddress(e.target.value);
  }, []);
  
  // Save manual address
  const saveManualAddress = useCallback(() => {
    if (manualAddress.trim()) {
      setAddress(manualAddress);
      setShowManualEntry(false);
    } else {
      toast.error('Please enter a valid address description');
    }
  }, [manualAddress]);
  
  // Get current location
  const getCurrentLocationHandler = useCallback(() => {
    if (!isMounted.current) return;
    
    setLoading(true);
    console.log('Getting current location...');
    
    // First check if the map and marker are initialized
    if (!mapInstanceRef.current || !markerRef.current) {
      console.warn('Map or marker not initialized, trying to get location anyway');
    }
    
    getCurrentPosition()
      .then((position) => {
        if (!isMounted.current) return;
        
        const { lat, lng, accuracy } = position;
        console.log('Successfully got position:', { lat, lng, accuracy });
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinates received');
        }
        
        // Update state with the new position
        setPosition({ lat, lng });
        setAccuracy(accuracy);
        
        // Get address for the current position - this might fail separately
        loadAddress(lat, lng)
          .catch(error => {
            console.error('Failed to load address, continuing with coordinates only:', error);
            setAddress(`Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          });
        
        // Force map to recenter and update marker icon to the current location icon
        // This is in a separate try-catch to ensure it doesn't affect the position update
        try {
          if (mapInstanceRef.current && markerRef.current) {
            // Update marker
            markerRef.current.setLatLng([lat, lng]);
            markerRef.current.setIcon(currentLocationIcon);
            
            // Ensure dragging is enabled
            if (markerRef.current.dragging) {
              markerRef.current.dragging.enable();
            }
            
            // Pan to new position
            mapInstanceRef.current.panTo([lat, lng], {
              animate: true,
              duration: 0.5
            });
            
            // Add accuracy circle if available
            if (accuracy && accuracy > 0) {
              // Remove any existing accuracy circles
              mapInstanceRef.current.eachLayer((layer) => {
                if (layer._radius) {
                  mapInstanceRef.current.removeLayer(layer);
                }
              });
              
              // Add new accuracy circle
              if (leafletRef.current) {
                const { L } = leafletRef.current;
                L.circle([lat, lng], {
                  radius: accuracy,
                  color: 'blue',
                  fillColor: 'rgba(0, 0, 255, 0.1)',
                  fillOpacity: 0.3
                }).addTo(mapInstanceRef.current);
                
                // Add a popup to the marker
                markerRef.current.bindPopup(`You are within ${Math.round(accuracy)} meters of this point`).openPopup();
              }
            }
            
            // Force a resize to ensure everything renders correctly
            setTimeout(() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
              }
            }, 100);
          } else {
            console.warn('Map or marker not available to update view');
          }
        } catch (viewUpdateError) {
          console.error('Error updating map view after position change:', viewUpdateError);
          // Don't rethrow - we still have the position
        }
      })
      .catch((error) => {
        console.error('Error getting location:', error);
        if (isMounted.current) {
          toast.error(`Could not get your location: ${error.message || 'Please check your browser permissions or try selecting on the map.'}`);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, [loadAddress]);
  
  // Reset map in case of errors
  const resetMap = useCallback(() => {
    setMapInitialized(false);
    setMapError(false);
    setMapLoading(true);
  }, []);
  
  return (
    <div className="relative w-full" style={{ height }}>
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden shadow-md"
        style={{ display: mapLoading || mapError ? 'none' : 'block' }}
      ></div>
      
      {/* Loading indicator */}
      {mapLoading && !mapError && (
        <LoadingIndicator />
      )}
      
      {/* Error state */}
      {mapError && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <p className="text-red-600 mb-3">An error occurred while loading the map.</p>
            <button
              onClick={resetMap}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Drag marker hint */}
      {!mapLoading && !mapError && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-80 p-2 rounded shadow-md text-sm text-gray-700 max-w-[260px] z-[400]">
          <p>Drag the marker <span className="text-red-600">📍</span> to adjust location precisely</p>
        </div>
      )}
      
      {/* Current location button */}
      {showCurrentLocationButton && !mapLoading && !mapError && (
        <CurrentLocationButton onClick={getCurrentLocationHandler} loading={loading} />
      )}
      
      {/* Address display and editing */}
      {address && !showManualEntry && (
        <div className="mt-2 text-sm text-gray-600">
          <strong>Selected location:</strong> {address}
          <button 
            onClick={() => setShowManualEntry(true)}
            className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
          >
            Edit
          </button>
        </div>
      )}
      
      {/* Manual address entry form */}
      {showManualEntry && (
        <div className="mt-2">
          <div className="flex">
            <input
              type="text"
              value={manualAddress}
              onChange={handleManualAddressChange}
              placeholder="Enter location description manually"
              className="flex-grow px-3 py-1 border rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={saveManualAddress}
              className="bg-blue-600 text-white px-3 py-1 rounded-r hover:bg-blue-700"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Please enter a description for this location
          </p>
        </div>
      )}
      
      {/* Prompt to add manual description if none exists */}
      {!address && !showManualEntry && position.lat !== 0 && position.lng !== 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowManualEntry(true)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Add location description manually
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 