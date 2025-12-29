import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AddressForm = ({ address = null, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    label: 'Home',
    houseNoBuilding: '',
    areaColony: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || 'Home',
        houseNoBuilding: address.houseNoBuilding || '',
        areaColony: address.areaColony || '',
        landmark: address.landmark || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        isDefault: address.isDefault || false,
      });
    }
  }, [address]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.houseNoBuilding.trim()) {
      newErrors.houseNoBuilding = 'House/Building number is required';
    }

    if (!formData.areaColony.trim()) {
      newErrors.areaColony = 'Area/Colony is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Label */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Address Label</label>
          <select
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
          {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Enter 6-digit pincode"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
        </div>

        {/* House/Building */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">House No. / Building Name</label>
          <input
            type="text"
            name="houseNoBuilding"
            value={formData.houseNoBuilding}
            onChange={handleChange}
            placeholder="e.g., 123, Apartment 4B, Building A"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.houseNoBuilding && (
            <p className="text-red-500 text-sm mt-1">{errors.houseNoBuilding}</p>
          )}
        </div>

        {/* Area/Colony */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">Area / Colony</label>
          <input
            type="text"
            name="areaColony"
            value={formData.areaColony}
            onChange={handleChange}
            placeholder="e.g., MG Road, Downtown Area"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.areaColony && <p className="text-red-500 text-sm mt-1">{errors.areaColony}</p>}
        </div>

        {/* Landmark */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">Landmark (Optional)</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            placeholder="e.g., Near Central Park, Next to School"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g., New York"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        {/* State */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="e.g., New York"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        {/* Set as Default */}
        <div className="md:col-span-2 flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 text-gray-700">
            Set as default address
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition order-2 sm:order-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition order-1 sm:order-2 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
