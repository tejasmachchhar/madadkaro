import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import CategorySelect from '../components/CategorySelect';
import GoogleMapPicker from '../components/GoogleMapPicker';
import { getLocationDataFromCoordinates, getCurrentPosition, getCoordinatesFromAddress } from '../utils/locationUtils';

const PostTaskPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Added to get query params
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(''); // To store _id of selected address or 'new'
  const [useLocationBasedAddress, setUseLocationBasedAddress] = useState(true); // Toggle for location-based vs custom address (default: true for auto-fill)
  const [customAddressFields, setCustomAddressFields] = useState({ // Store custom address fields separately
    pincode: '',
    houseNoBuilding: '',
    areaColony: '',
    landmark: '',
    city: '',
    state: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    // address: '', // Changed from location and locationDetails - Now broken into components
    pincode: '',
    houseNoBuilding: '',
    areaColony: '',
    landmark: '', // Optional
    city: '',
    state: '',
    category: '',
    subcategory: '',
    dateRequired: '',
    timeRequired: '',
    duration: '',
    isUrgent: false,
    images: [],
    latitude: '',
    longitude: ''
  });

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Effect to pre-fill category from URL query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryFromUrl = queryParams.get('category');
    if (categoryFromUrl) {
      setFormData((prev) => ({
        ...prev,
        category: categoryFromUrl,
      }));
    }
  }, [location.search]);

  // Fetch user's saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (currentUser) {
        setIsLoadingAddresses(true);
        try {
          const response = await api.get('/users/profile/addresses');
          setSavedAddresses(response.data || []);
          // Optionally, pre-select the default address if one exists and no other address is selected
          const defaultAddress = response.data?.find(addr => addr.isDefault);
          if (defaultAddress && !selectedAddressId) {
            setSelectedAddressId(defaultAddress._id);
            setFormData(prev => ({
              ...prev,
              pincode: defaultAddress.pincode,
              houseNoBuilding: defaultAddress.houseNoBuilding,
              areaColony: defaultAddress.areaColony,
              landmark: defaultAddress.landmark || '',
              city: defaultAddress.city,
              state: defaultAddress.state,
            }));
            // Also set custom address fields
            setCustomAddressFields({
              pincode: defaultAddress.pincode,
              houseNoBuilding: defaultAddress.houseNoBuilding,
              areaColony: defaultAddress.areaColony,
              landmark: defaultAddress.landmark || '',
              city: defaultAddress.city,
              state: defaultAddress.state
            });
            // When a saved address is selected, use custom mode
            setUseLocationBasedAddress(false);
          } else if (response.data?.length > 0 && !selectedAddressId) {
            // If no default, but addresses exist, prompt to select or add new
            setSelectedAddressId(''); // Explicitly set to empty to show 'Select...' or 'Add new'
            // Ensure location-based mode is enabled for new addresses
            setUseLocationBasedAddress(true);
          } else {
            // No addresses, or forcing new entry
            setSelectedAddressId('new');
            // Ensure location-based mode is enabled for new addresses
            setUseLocationBasedAddress(true);
          }
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
          // toast.error('Could not load saved addresses.'); // Optional: notify user
          setSavedAddresses([]);
          setSelectedAddressId('new'); // Default to new address if fetch fails
          // Ensure location-based mode is enabled for new addresses
          setUseLocationBasedAddress(true);
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };
    fetchAddresses();
  }, [currentUser]);

  // Auto-fill location when page loads if in location-based mode and no saved address is selected
  useEffect(() => {
    const autoFillLocation = async () => {
      // Only auto-fill if:
      // 1. Location-based mode is enabled
      // 2. No saved address is selected (new address or empty)
      // 3. Coordinates are not already set
      // 4. User is logged in (addresses are loaded)
      if (
        useLocationBasedAddress &&
        (selectedAddressId === 'new' || selectedAddressId === '') &&
        !formData.latitude &&
        !formData.longitude &&
        currentUser &&
        !isLoadingAddresses
      ) {
        setIsLoadingLocation(true);
        try {
          const position = await getCurrentPosition();
          const { lat, lng } = position;
          
          // Update coordinates and get location data
          const locationData = await getLocationDataFromCoordinates(lat, lng);
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
            city: locationData.city || prev.city,
            state: locationData.state || prev.state,
            pincode: locationData.pincode || prev.pincode
          }));
        } catch (error) {
          console.error('Failed to get current location automatically:', error);
          // Silently fail - user can still click on map or use "Find My Location" button
        } finally {
          setIsLoadingLocation(false);
        }
      }
    };

    // Small delay to ensure addresses are loaded first
    const timer = setTimeout(() => {
      autoFillLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, [useLocationBasedAddress, selectedAddressId, currentUser, isLoadingAddresses, formData.latitude, formData.longitude]);

  const handleAddressSelectionChange = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);

    if (addressId === 'new' || addressId === '') {
      // Clear form fields for new address entry or if 'Select...' is chosen
      setFormData(prev => ({
        ...prev,
        pincode: '',
        houseNoBuilding: '',
        areaColony: '',
        landmark: '',
        city: '',
        state: '',
      }));
      // Also clear custom address fields
      setCustomAddressFields({
        pincode: '',
        houseNoBuilding: '',
        areaColony: '',
        landmark: '',
        city: '',
        state: ''
      });
      // Explicitly set to location-based mode when selecting new address
      // This allows auto-fill to work when user adds a new address
      setUseLocationBasedAddress(true);
    } else {
      const selected = savedAddresses.find(addr => addr._id === addressId);
      if (selected) {
        // Construct full address string for geocoding
        const fullAddress = `${selected.houseNoBuilding}, ${selected.areaColony}${selected.landmark ? `, ${selected.landmark}` : ''}, ${selected.city}, ${selected.state} - ${selected.pincode}`;

        setFormData(prev => ({
          ...prev,
          pincode: selected.pincode,
          houseNoBuilding: selected.houseNoBuilding,
          areaColony: selected.areaColony,
          landmark: selected.landmark || '',
          city: selected.city,
          state: selected.state,
        }));
        // Save to custom fields as well
        setCustomAddressFields({
          pincode: selected.pincode,
          houseNoBuilding: selected.houseNoBuilding,
          areaColony: selected.areaColony,
          landmark: selected.landmark || '',
          city: selected.city,
          state: selected.state
        });

        // Try to geocode the address to get coordinates
        const geocodeAddress = async () => {
          try {
            const coordinates = await getCoordinatesFromAddress(fullAddress);
            if (coordinates) {
              setFormData(prev => ({
                ...prev,
                latitude: coordinates.lat.toString(),
                longitude: coordinates.lng.toString(),
              }));
            }
          } catch (error) {
            console.warn('Failed to geocode saved address:', error);
            // Continue without coordinates - the sparse index will handle this
          }
        };
        geocodeAddress();

        // Reset to custom mode when selecting a saved address
        setUseLocationBasedAddress(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If in custom mode and user is editing address fields, update custom fields storage
    if (!useLocationBasedAddress && ['pincode', 'houseNoBuilding', 'areaColony', 'landmark', 'city', 'state'].includes(name)) {
      setCustomAddressFields(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId,
      subcategory: '' // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (subcategoryId) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: subcategoryId
    }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      images: Array.from(e.target.files)
    }));
  };

  const handleLocationSelect = async ({ lat, lng }) => {
    // Update coordinates first
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

    // Auto-fill location data when user selects a location on the map
    // Only auto-fill if location-based mode is enabled
    if (useLocationBasedAddress) {
      setIsLoadingLocation(true);
      try {
        const locationData = await getLocationDataFromCoordinates(lat, lng);
        
        // Auto-fill all address fields from location data when in location-based mode
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          city: locationData.city || prev.city,
          state: locationData.state || prev.state,
          pincode: locationData.pincode || prev.pincode
          // Note: houseNoBuilding, areaColony, and landmark cannot be determined from coordinates
          // These remain as user-entered values
        }));
      } catch (error) {
        console.error('Failed to get location data:', error);
        // Don't show error to user, just silently fail
      } finally {
        setIsLoadingLocation(false);
      }
    }
  };

  // Handle toggle between location-based and custom address
  const handleAddressModeChange = (useLocation) => {
    setUseLocationBasedAddress(useLocation);
    
    if (useLocation) {
      // Switching to location-based mode: save current custom fields and clear them
      setCustomAddressFields({
        pincode: formData.pincode,
        houseNoBuilding: formData.houseNoBuilding,
        areaColony: formData.areaColony,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state
      });
      
      // If we have coordinates, fetch and fill location data
      if (formData.latitude && formData.longitude) {
        setIsLoadingLocation(true);
        getLocationDataFromCoordinates(parseFloat(formData.latitude), parseFloat(formData.longitude))
          .then(locationData => {
            setFormData(prev => ({
              ...prev,
              city: locationData.city || prev.city,
              state: locationData.state || prev.state,
              pincode: locationData.pincode || prev.pincode
            }));
          })
          .catch(error => {
            console.error('Failed to get location data:', error);
          })
          .finally(() => {
            setIsLoadingLocation(false);
          });
      }
    } else {
      // Switching to custom mode: restore previously saved custom fields
      setFormData(prev => ({
        ...prev,
        pincode: customAddressFields.pincode || prev.pincode,
        houseNoBuilding: customAddressFields.houseNoBuilding || prev.houseNoBuilding,
        areaColony: customAddressFields.areaColony || prev.areaColony,
        landmark: customAddressFields.landmark || prev.landmark,
        city: customAddressFields.city || prev.city,
        state: customAddressFields.state || prev.state
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate the form data
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.budget || isNaN(formData.budget) || Number(formData.budget) <= 0) {
        throw new Error('Please enter a valid budget amount');
      }
      if (!formData.category) {
        throw new Error('Please select a category');
      }
      if (!formData.subcategory) {
        throw new Error('Please select a subcategory');
      }
      if (!formData.pincode.trim()) {
        throw new Error('Pincode is required');
      }
      if (!formData.houseNoBuilding.trim()) {
        throw new Error('House No., Building Name is required');
      }
      if (!formData.areaColony.trim()) {
        throw new Error('Area, Colony, Street, Sector, Village is required');
      }
      // Landmark is optional
      if (!formData.city.trim()) {
        throw new Error('City is required');
      }
      if (!formData.state.trim()) {
        throw new Error('State is required');
      }
      if (!formData.dateRequired) {
        throw new Error('Date is required');
      }
      if (!formData.timeRequired) {
        throw new Error('Time is required');
      }
      if (!formData.duration || isNaN(formData.duration) || Number(formData.duration) <= 0) {
        throw new Error('Please enter a valid task duration');
      }

      // Create FormData object for file upload
      const taskFormData = new FormData();
      taskFormData.append('title', formData.title);
      taskFormData.append('description', formData.description);
      taskFormData.append('budget', formData.budget);
      // Construct full address string
      const fullAddress = `${formData.houseNoBuilding}, ${formData.areaColony}${formData.landmark ? `, ${formData.landmark}` : ''}, ${formData.city}, ${formData.state} - ${formData.pincode}`;
      taskFormData.append('address', fullAddress);
      taskFormData.append('category', formData.category);
      taskFormData.append('subcategory', formData.subcategory);
      taskFormData.append('dateRequired', formData.dateRequired);
      taskFormData.append('timeRequired', formData.timeRequired);
      taskFormData.append('duration', formData.duration);
      taskFormData.append('isUrgent', formData.isUrgent);
      if (formData.latitude && formData.longitude) {
        taskFormData.append('latitude', formData.latitude);
        taskFormData.append('longitude', formData.longitude);
      }
      
      // Add images if any
      if (formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          taskFormData.append('images', formData.images[i]);
        }
      }

      // Send the request
      const response = await api.post('/tasks', taskFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Save address if checkbox is checked and it's a new address
      if (formData.saveAddress && selectedAddressId === 'new') {
        try {
          const addressData = {
            pincode: formData.pincode,
            houseNoBuilding: formData.houseNoBuilding,
            areaColony: formData.areaColony,
            landmark: formData.landmark || '',
            city: formData.city,
            state: formData.state,
            label: formData.addressLabel || '',
            isDefault: savedAddresses.length === 0 // Make it default if it's the first address
          };
          
          await api.post('/users/profile/addresses', addressData);
          // Optionally refresh the saved addresses list
          const updatedAddresses = await api.get('/users/profile/addresses');
          setSavedAddresses(updatedAddresses.data || []);
        } catch (addressError) {
          console.error('Failed to save address:', addressError);
          // Don't show error to user as task was posted successfully
        }
      }

      toast.success('Task posted successfully!');
      // Reset lat/lng after submit
      setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
      navigate('/my-tasks');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to post task';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Posting...</p>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Post a New Task</h1>
        
        <form onSubmit={handleSubmit} encType="multipart/form-data" aria-busy={isLoading}>
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Fix leaking kitchen faucet"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Description*</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
                placeholder="Describe your task in detail. Include what needs to be done, when, where, and any specific requirements."
                required
                disabled={isLoading}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Address Fields */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Address Details</h3>
                {isLoadingAddresses && <p>Loading addresses...</p>}
                {!isLoadingAddresses && savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Select Saved Address</label>
                    <select
                      name="selectedAddress"
                      value={selectedAddressId}
                      onChange={handleAddressSelectionChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">-- Select an Address --</option>
                      {savedAddresses.map(addr => (
                        <option key={addr._id} value={addr._id}>
                          {addr.label ? `${addr.label} (${addr.houseNoBuilding}, ${addr.city})` : `${addr.houseNoBuilding}, ${addr.areaColony}, ${addr.city}`}
                        </option>
                      ))}
                      <option value="new">+ Add New Address</option>
                    </select>
                  </div>
                )}
                {/* Show selected address details when an address is selected */}
                {selectedAddressId && selectedAddressId !== 'new' && savedAddresses.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 border rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Selected Address:</h4>
                    <div className="text-gray-700">
                      {(() => {
                        const selected = savedAddresses.find(addr => addr._id === selectedAddressId);
                        if (selected) {
                          return (
                            <div>
                              {selected.label && <div className="font-medium">{selected.label}</div>}
                              <div>{selected.houseNoBuilding}</div>
                              <div>{selected.areaColony}</div>
                              {selected.landmark && <div>{selected.landmark}</div>}
                              <div>{selected.city}, {selected.state} - {selected.pincode}</div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Show address form if 'new' is selected or no saved addresses */} 
                {(selectedAddressId === 'new' || (savedAddresses.length === 0 && !isLoadingAddresses)) && (
                  <div className="space-y-4">
                    {/* Address Mode Toggle */}
                    <div className="mb-4 p-4 bg-gray-50 border rounded-lg">
                      <label className="block text-gray-700 font-medium mb-3">Address Input Mode</label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="addressMode"
                            checked={!useLocationBasedAddress}
                            onChange={() => handleAddressModeChange(false)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <span className="text-gray-700">Custom Address (Manual Entry)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="addressMode"
                            checked={useLocationBasedAddress}
                            onChange={() => handleAddressModeChange(true)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <span className="text-gray-700">Location-Based (Auto-fill from Map)</span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {useLocationBasedAddress 
                          ? "Address fields will be auto-filled when you click on the map. You can still edit them manually."
                          : "Enter address fields manually. Your entries will be saved when switching modes."}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Pincode*</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 400001"
                          required
                          maxLength="6"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">City*</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Mumbai"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">State*</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Maharashtra"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-2">House No., Building Name*</label>
                        <input
                          type="text"
                          name="houseNoBuilding"
                          value={formData.houseNoBuilding}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 123, Sunshine Apartments"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-2">Area, Colony, Street, Sector, Village*</label>
                        <input
                          type="text"
                          name="areaColony"
                          value={formData.areaColony}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Main Street, Juhu"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-2">Landmark (Optional)</label>
                        <input
                          type="text"
                          name="landmark"
                          value={formData.landmark}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Near City Mall"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-2">
                          Select Exact Location (Optional)
                          {isLoadingLocation && (
                            <span className="ml-2 text-sm text-gray-500">Loading location data...</span>
                          )}
                        </label>
                        <GoogleMapPicker
                          onLocationSelect={handleLocationSelect}
                          initialLocation={formData.latitude && formData.longitude ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : null}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {useLocationBasedAddress 
                            ? "Click on the map or use 'Find My Location' to auto-fill city, state, and pincode from the selected location."
                            : "Click on the map to set coordinates. Address fields won't be auto-filled in custom mode."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Save address option */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        name="saveAddress"
                        checked={formData.saveAddress || false}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <label htmlFor="saveAddress" className="text-gray-700 font-medium">
                        Save this address for future use
                      </label>
                    </div>
                    
                    {formData.saveAddress && (
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Address Label (Optional)</label>
                        <input
                          type="text"
                          name="addressLabel"
                          value={formData.addressLabel || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Home, Office, etc."
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* End Address Details Section */}
              
              <CategorySelect 
                selectedCategory={formData.category}
                selectedSubcategory={formData.subcategory}
                onCategoryChange={handleCategoryChange}
                onSubcategoryChange={handleSubcategoryChange}
              />
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Budget (₹)*</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your budget for this task"
                  min="1"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date Required*</label>
                <input
                  type="date"
                  name="dateRequired"
                  value={formData.dateRequired}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Time Required*</label>
                <input
                  type="time"
                  name="timeRequired"
                  value={formData.timeRequired}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Duration (in hours)*</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Estimated duration in hours"
                  min="1"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isUrgent"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <label htmlFor="isUrgent" className="ml-2 text-gray-700">
                  This is an urgent task
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Task Images (Optional)</label>
              <input
                type="file"
                name="images"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                multiple
                accept="image/*"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                You can upload up to 5 images to help taskers understand your task better.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition order-2 sm:order-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition order-1 sm:order-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Posting Task...</span>
                ) : (
                  <span>Post Task</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostTaskPage;