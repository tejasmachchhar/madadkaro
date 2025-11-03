import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminNavigation from '../components/AdminNavigation';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminFeesPage = () => {
  const { isAdmin } = useAuth();
  const [fees, setFees] = useState({
    platformFeePercentage: 5,
    trustAndSupportFee: 2,
    commissionPercentage: 15,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data } = await api.get('/admin/platform-fees');
        setFees(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch platform fees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data } = await api.put('/admin/platform-fees', fees);
      setFees(data);
      toast.success('Platform fees updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update platform fees');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFees(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <Link to="/" className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/5">
          <AdminNavigation />
        </div>

        {/* Main Content */}
        <div className="lg:w-4/5">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Platform Fees Management</h1>
            <p className="text-gray-600">Configure platform fees and charges</p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">Loading...</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Platform Fee Percentage
                  </label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="platformFeePercentage"
                      value={fees.platformFeePercentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Percentage fee charged to customers on task budget
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trust & Support Fee
                  </label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      name="trustAndSupportFee"
                      value={fees.trustAndSupportFee}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Fixed fee charged for platform trust and support services
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Commission Percentage
                  </label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="commissionPercentage"
                      value={fees.commissionPercentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Commission percentage charged to taskers
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeesPage;