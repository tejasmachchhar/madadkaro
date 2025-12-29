import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import AddressForm from './AddressForm';

const AddressManager = ({ onAddressSelect = null, showSelectMode = false, selectedAddressId = null }) => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Fetch addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile/addresses');
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    try {
      if (editingAddress) {
        // Update existing address
        await api.put(`/users/profile/addresses/${editingAddress._id}`, formData);
        toast.success('Address updated successfully');
      } else {
        // Add new address
        await api.post('/users/profile/addresses', formData);
        toast.success('Address added successfully');
      }
      setShowForm(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await api.delete(`/users/profile/addresses/${addressId}`);
        toast.success('Address deleted successfully');
        await fetchAddresses();
      } catch (error) {
        console.error('Failed to delete address:', error);
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.put(`/users/profile/addresses/${addressId}/default`);
      toast.success('Default address updated');
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Failed to set default address');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">My Addresses</h3>
        {!showForm && (
          <button
            onClick={handleAddAddress}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition text-sm font-medium"
          >
            + Add Address
          </button>
        )}
      </div>

      {/* Address Form */}
      {showForm && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h4>
          <AddressForm
            address={editingAddress}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoadingForm}
          />
        </div>
      )}

      {/* Addresses List */}
      {!showForm && (
        <div className="space-y-4">
          {addresses && addresses.length > 0 ? (
            addresses.map((address) => (
              <div
                key={address._id}
                className={`border rounded-lg p-4 hover:shadow-md transition ${
                  showSelectMode && selectedAddressId === address._id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{address.label}</h4>
                      {address.isDefault && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">
                      {address.houseNoBuilding}, {address.areaColony}
                    </p>
                    {address.landmark && (
                      <p className="text-gray-600 text-sm">Landmark: {address.landmark}</p>
                    )}
                    <p className="text-gray-700 mt-1">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    {showSelectMode && (
                      <button
                        onClick={() => onAddressSelect && onAddressSelect(address)}
                        className={`py-1 px-3 rounded text-sm font-medium transition ${
                          selectedAddressId === address._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {selectedAddressId === address._id ? '✓ Selected' : 'Select'}
                      </button>
                    )}
                    {!showSelectMode && (
                      <>
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="bg-blue-100 text-blue-600 hover:bg-blue-200 py-1 px-3 rounded text-sm font-medium transition"
                        >
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address._id)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200 py-1 px-3 rounded text-sm font-medium transition"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="bg-red-100 text-red-600 hover:bg-red-200 py-1 px-3 rounded text-sm font-medium transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No addresses added yet</p>
              <button
                onClick={handleAddAddress}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Add Your First Address
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressManager;
