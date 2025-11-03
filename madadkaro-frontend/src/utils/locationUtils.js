/**
 * Location utility functions for geocoding and coordinates
 */

// Local cache for geocoding results to reduce API calls
const geocodingCache = new Map();

// Common locations in India for fallback when API fails
const COMMON_LOCATIONS = {
  // Cities with coordinates and names
  'Delhi': { lat: 28.6139, lng: 77.2090, address: 'Delhi, India' },
  'Mumbai': { lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra, India' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka, India' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, address: 'Hyderabad, Telangana, India' },
  'Chennai': { lat: 13.0827, lng: 80.2707, address: 'Chennai, Tamil Nadu, India' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, address: 'Kolkata, West Bengal, India' },
  'Pune': { lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra, India' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, address: 'Ahmedabad, Gujarat, India' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, address: 'Jaipur, Rajasthan, India' },
  'Lucknow': { lat: 26.8467, lng: 80.9462, address: 'Lucknow, Uttar Pradesh, India' }
};

// Reverse lookup map for coordinates to nearby common locations (within 10km)
const COORDINATE_LOOKUP = {};

// Initialize the reverse lookup map
Object.entries(COMMON_LOCATIONS).forEach(([city, data]) => {
  const key = `${Math.round(data.lat * 100) / 100},${Math.round(data.lng * 100) / 100}`;
  COORDINATE_LOOKUP[key] = data.address;
});

/**
 * Try to fetch from the API directly with proper error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 8000, ...fetchOptions } = options;
  
  // Create a new AbortController for this specific request
  const controller = new AbortController();
  
  // Setup the timeout
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timed out'));
      clearTimeout(timeoutId);
    }, timeout);
  });
  
  try {
    // Add cache busting parameter
    const urlWithNonce = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
    
    // Race the fetch against the timeout
    const response = await Promise.race([
      fetch(urlWithNonce, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MadadKaro/1.0',
          ...fetchOptions.headers
        }
      }),
      timeoutPromise
    ]);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request was aborted');
    }
    throw error;
  }
}

/**
 * Try to get the user's location using the browser's native location features
 * as an alternative to OpenStreetMap
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Address string
 */
async function getLocationFromNative(lat, lng) {
  try {
    // Some browsers can translate coordinates to addresses natively
    if (window.Intl && typeof window.Intl.DisplayNames === 'function') {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      
      // This is just a rough approximation
      const regionCode = 'IN'; // Default to India
      
      return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}, ${regionNames.of(regionCode)}`;
    }
    
    // Fallback if Intl is not available
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Error using native location features:', error);
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Find nearest common location within distance
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @returns {string|null} - Address string or null if no match
 */
function findNearestCommonLocation(lat, lng, maxDistanceKm = 10) {
  let nearest = null;
  let minDistance = maxDistanceKm;
  
  Object.entries(COMMON_LOCATIONS).forEach(([city, data]) => {
    const distance = calculateDistance(lat, lng, data.lat, data.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = data.address;
    }
  });
  
  return nearest;
}

/**
 * Get address from coordinates using OpenStreetMap Nominatim API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Address string
 */
export const getAddressFromCoordinates = async (lat, lng) => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates provided to getAddressFromCoordinates');
    return '';
  }
  
  // Check cache first
  const cacheKey = `${lat},${lng}`;
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey);
  }
  
  // Check if coordinates are near a common location
  // This provides a fast fallback without API calls
  const nearestCommonLocation = findNearestCommonLocation(lat, lng);
  if (nearestCommonLocation) {
    const approximateAddress = `Near ${nearestCommonLocation}`;
    geocodingCache.set(cacheKey, approximateAddress);
    return approximateAddress;
  }

  // Try alternative geocoding API first (more reliable than OpenStreetMap)
  try {
    // BigDataCloud Reverse Geocoding API (free tier with higher limits)
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    
    const response = await fetchWithTimeout(url, { timeout: 5000 });
    const data = await response.json();
    
    if (data && data.city) {
      // Format address from components
      const addressParts = [];
      
      if (data.locality) addressParts.push(data.locality);
      if (data.city) addressParts.push(data.city);
      if (data.principalSubdivision) addressParts.push(data.principalSubdivision);
      if (data.countryName) addressParts.push(data.countryName);
      
      const address = addressParts.join(', ');
      
      if (address) {
        geocodingCache.set(cacheKey, address);
        return address;
      }
    }
  } catch (error) {
    console.warn('API call to alternative geocoding service failed:', error.message);
    // Continue to OpenStreetMap
  }

  // Fallback to OpenStreetMap API
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetchWithTimeout(url, { 
      timeout: 5000,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': window.location.origin || 'https://madadkaro.com'
      }
    });
    
    const data = await response.json();
    
    if (data && data.display_name) {
      const address = data.display_name;
      geocodingCache.set(cacheKey, address);
      return address;
    }
  } catch (error) {
    console.warn('API call to OpenStreetMap failed, falling back to local data:', error.message);
    // Continue to fallbacks - don't return here
  }

  // Try using native browser features if available
  try {
    const nativeAddress = await getLocationFromNative(lat, lng);
    if (nativeAddress) {
      geocodingCache.set(cacheKey, nativeAddress);
      return nativeAddress;
    }
  } catch (nativeError) {
    console.log('Native location method not available:', nativeError);
  }
  
  // Get the country based on coordinates if possible
  let countryName = "";
  try {
    const latRounded = Math.round(lat);
    const lngRounded = Math.round(lng);
    
    // Simple coordinate-based country detection for common regions in India
    if (latRounded >= 8 && latRounded <= 37 && lngRounded >= 68 && lngRounded <= 97) {
      countryName = "India";
    }
  } catch (e) {
    console.error('Error determining country:', e);
  }
  
  // Final fallback - return approximate location based on rounded coordinates
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  const key = `${roundedLat},${roundedLng}`;
  
  if (COORDINATE_LOOKUP[key]) {
    return `Near ${COORDINATE_LOOKUP[key]}`;
  }
  
  // If all else fails, return generic message with coordinates
  const fallbackAddress = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}${countryName ? `, ${countryName}` : ''}`;
  geocodingCache.set(cacheKey, fallbackAddress);
  return fallbackAddress;
};

/**
 * Get structured location data (city, state, pincode) from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{city: string, state: string, pincode: string}>} - Location data object
 */
export const getLocationDataFromCoordinates = async (lat, lng) => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates provided to getLocationDataFromCoordinates');
    return { city: '', state: '', pincode: '' };
  }

  // Check cache first (use a different cache key for structured data)
  const cacheKey = `locationData_${lat},${lng}`;
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey);
  }

  // Try BigDataCloud API first (more reliable and returns structured data)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    
    const response = await fetchWithTimeout(url, { timeout: 5000 });
    const data = await response.json();
    
    if (data) {
      const locationData = {
        city: data.city || data.locality || data.principalSubdivision || '',
        state: data.principalSubdivision || data.administrativeArea || '',
        pincode: data.postcode || data.postalCode || ''
      };

      // Cache the result
      geocodingCache.set(cacheKey, locationData);
      return locationData;
    }
  } catch (error) {
    console.warn('API call to BigDataCloud failed:', error.message);
    // Continue to OpenStreetMap
  }

  // Fallback to OpenStreetMap API
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetchWithTimeout(url, { 
      timeout: 5000,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': window.location.origin || 'https://madadkaro.com'
      }
    });
    
    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      const locationData = {
        city: address.city || address.town || address.village || address.county || address.state_district || '',
        state: address.state || address.region || '',
        pincode: address.postcode || address.postal_code || ''
      };

      // Cache the result
      geocodingCache.set(cacheKey, locationData);
      return locationData;
    }
  } catch (error) {
    console.warn('API call to OpenStreetMap failed:', error.message);
  }

  // Try to extract from nearest common location
  const nearestCommonLocation = findNearestCommonLocation(lat, lng);
  if (nearestCommonLocation) {
    // Parse the address string to extract city and state
    const parts = nearestCommonLocation.split(', ');
    let city = '';
    let state = '';
    
    if (parts.length >= 2) {
      city = parts[0];
      state = parts[1];
    } else if (parts.length === 1) {
      city = parts[0];
    }

    const locationData = { city, state, pincode: '' };
    geocodingCache.set(cacheKey, locationData);
    return locationData;
  }

  // Final fallback - return empty strings
  const locationData = { city: '', state: '', pincode: '' };
  geocodingCache.set(cacheKey, locationData);
  return locationData;
};

/**
 * Get coordinates from address using OpenStreetMap Nominatim API
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates object or null if not found
 */
export const getCoordinatesFromAddress = async (address) => {
  if (!address || !address.trim()) {
    console.warn('Empty address provided to getCoordinatesFromAddress');
    return null;
  }
  
  // Check cache first
  if (geocodingCache.has(address)) {
    return geocodingCache.get(address);
  }
  
  // Check for common location names
  const normalizedAddress = address.trim().toLowerCase();
  for (const [city, data] of Object.entries(COMMON_LOCATIONS)) {
    if (normalizedAddress.includes(city.toLowerCase())) {
      return {
        lat: data.lat,
        lng: data.lng
      };
    }
  }

  // Try the direct API call first
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetchWithTimeout(url, { timeout: 5000 });
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      // Cache the result
      geocodingCache.set(address, result);
      
      return result;
    }
  } catch (error) {
    console.warn('API call to OpenStreetMap failed, falling back to local data:', error.message);
    // Continue to fallbacks
  }

  // Try more aggressive matching for partial matches
  for (const [city, data] of Object.entries(COMMON_LOCATIONS)) {
    // Check for city name or partial city name
    if (normalizedAddress.includes(city.toLowerCase().substring(0, 3)) || 
        city.toLowerCase().includes(normalizedAddress.split(' ')[0])) {
      console.info(`Using fallback coordinates for "${address}" matching with "${city}"`);
      return {
        lat: data.lat,
        lng: data.lng
      };
    }
  }
  
  // Last resort - if the address has "India" in it, default to Delhi
  if (normalizedAddress.includes('india')) {
    return {
      lat: COMMON_LOCATIONS['Delhi'].lat,
      lng: COMMON_LOCATIONS['Delhi'].lng
    };
  }
  
  // If absolutely nothing matches, use a default location (Delhi)
  return {
    lat: COMMON_LOCATIONS['Delhi'].lat,
    lng: COMMON_LOCATIONS['Delhi'].lng
  };
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Validate inputs
  if ([lat1, lng1, lat2, lng2].some(coord => coord === undefined || coord === null || isNaN(coord))) {
    console.warn('Invalid coordinates provided to calculateDistance');
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Get user's current position
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>} - Position object
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    // Add timeout to the geolocation request
    const timeoutId = setTimeout(() => {
      reject(new Error('Geolocation request timed out'));
    }, 15000);
    
    // Define options for better accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0  // Set to 0 to always get fresh position
    };

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          
          // Validate the coordinates before returning
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            reject(new Error('Invalid coordinates received from geolocation API'));
            return;
          }
          
          // Force log to debug
          console.log('Geolocation success:', { lat, lng, accuracy: position.coords.accuracy });
          
          resolve({
            lat: lat,
            lng: lng,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          
          // Force log to debug
          console.error('Geolocation error:', error);
          
          // Provide more specific error messages based on the error code
          switch(error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please allow location access in your browser settings.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable. Please try again or enter location manually.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out. Please check your connection and try again.'));
              break;
            default:
              reject(error);
          }
        },
        options
      );
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Unexpected geolocation error:', err);
      reject(new Error('Unexpected error accessing geolocation: ' + err.message));
    }
  });
}; 