import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <p>You do not have permission to access this page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <AdminNavigation />
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-8">
          <div className="w-full lg:w-64 mb-6 lg:mb-0">
            <AdminNavigation />
          </div>
          
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 sm:py-6 border-b border-gray-200">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Platform Fees Management</h1>
                <p className="mt-1 sm:mt-2 text-sm text-gray-600">Configure platform fees and charges</p>
              </div>

              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Platform Fee Percentage
                  </label>
                  <div className="mt-1 sm:mt-2 relative rounded-md shadow-sm">
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
                  <p className="mt-1 sm:mt-2 text-sm text-gray-500">
                    Percentage fee charged to customers on task budget
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trust & Support Fee
                  </label>
                  <div className="mt-1 sm:mt-2 relative rounded-md shadow-sm">
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
                  <p className="mt-1 sm:mt-2 text-sm text-gray-500">
                    Fixed fee charged for platform trust and support services
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Commission Percentage
                  </label>
                  <div className="mt-1 sm:mt-2 relative rounded-md shadow-sm">
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
                  <p className="mt-1 sm:mt-2 text-sm text-gray-500">
                    Commission percentage charged to taskers
                  </p>
                </div>

                <div className="pt-4 sm:pt-5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeesPage;