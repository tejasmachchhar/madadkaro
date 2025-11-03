import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavigation from '../components/AdminNavigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminReportsPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [userReport, setUserReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [earningReport, setEarningReport] = useState(null);
  
  useEffect(() => {
    if (isAdmin()) {
      fetchReportData();
    }
  }, [activeTab, timeRange]);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/admin/reports?reportType=${activeTab}&timeRange=${timeRange}`);
      
      if (activeTab === 'users') {
        setUserReport(response.data);
      } else if (activeTab === 'tasks') {
        setTaskReport(response.data);
      } else if (activeTab === 'earnings') {
        setEarningReport(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch report data');
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // User trend chart data
  const getUserTrendChartData = () => {
    if (!userReport || !userReport.usersByDate || userReport.usersByDate.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const sortedData = [...userReport.usersByDate].sort((a, b) => new Date(a._id) - new Date(b._id));
    
    return {
      labels: sortedData.map(item => {
        const date = new Date(item._id);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'New Users',
          data: sortedData.map(item => item.count),
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          tension: 0.4
        }
      ]
    };
  };
  
  // User distribution chart data
  const getUserDistributionChartData = () => {
    if (!userReport || !userReport.usersByRole || userReport.usersByRole.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: userReport.usersByRole.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1) + 's'),
      datasets: [
        {
          data: userReport.usersByRole.map(item => item.count),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Task status chart data
  const getTaskStatusChartData = () => {
    if (!taskReport || !taskReport.tasksByStatus || taskReport.tasksByStatus.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: taskReport.tasksByStatus.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
      datasets: [
        {
          data: taskReport.tasksByStatus.map(item => item.count),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Task category chart data
  const getTaskCategoryChartData = () => {
    if (!taskReport || !taskReport.tasksByCategory || taskReport.tasksByCategory.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: taskReport.tasksByCategory.map(item => item._id),
      datasets: [
        {
          label: 'Tasks by Category',
          data: taskReport.tasksByCategory.map(item => item.count),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Earnings by date chart data
  const getEarningsByDateChartData = () => {
    if (!earningReport || !earningReport.earningsByDate || earningReport.earningsByDate.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const sortedData = [...earningReport.earningsByDate].sort((a, b) => new Date(a._id) - new Date(b._id));
    
    return {
      labels: sortedData.map(item => {
        const date = new Date(item._id);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Platform Earnings',
          data: sortedData.map(item => item.earnings),
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.4
        }
      ]
    };
  };
  
  // Earnings by category chart data
  const getEarningsByCategoryChartData = () => {
    if (!earningReport || !earningReport.earningsByCategory || earningReport.earningsByCategory.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: earningReport.earningsByCategory.map(item => item._id),
      datasets: [
        {
          label: 'Earnings by Category',
          data: earningReport.earningsByCategory.map(item => item.earnings),
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            
            if (label) {
              label += ': ';
            }
            
            if (activeTab === 'earnings') {
              return label + formatCurrency(context.raw);
            }
            
            return label + context.raw;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (activeTab === 'earnings') {
              return formatCurrency(value);
            }
            return value;
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
            <p className="text-gray-600">View platform statistics and trends</p>
          </div>
          
          {/* Report Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === 'users'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  User Reports
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === 'tasks'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Task Reports
                </button>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === 'earnings'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Earnings Reports
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Report Content with inline loading overlay */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                <div className="text-center text-gray-600">Loading report data...</div>
              </div>
            )}
            
            {/* Fallback: if no data yet for the selected tab, show stable-height loaders */}
            {activeTab === 'users' && !userReport && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-80 animate-pulse bg-gray-100 rounded" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-80 animate-pulse bg-gray-100 rounded" />
                </div>
              </div>
            )}
            {activeTab === 'tasks' && !taskReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="h-80 animate-pulse bg-gray-100 rounded" />
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="h-80 animate-pulse bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-80 animate-pulse bg-gray-100 rounded" />
                </div>
              </div>
            )}
            {activeTab === 'earnings' && !earningReport && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-80 animate-pulse bg-gray-100 rounded" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-80 animate-pulse bg-gray-100 rounded" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-48 animate-pulse bg-gray-100 rounded" />
                </div>
              </div>
            )}

            {/* Actual Reports */}
            {/* User Reports */}
            {activeTab === 'users' && userReport && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">User Registration Trend</h2>
                  <div className="h-80">
                    <Line 
                      data={getUserTrendChartData()} 
                      options={chartOptions} 
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">User Distribution by Role</h2>
                  <div className="h-80">
                    <Pie 
                      data={getUserDistributionChartData()} 
                      options={pieChartOptions} 
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Task Reports */}
            {activeTab === 'tasks' && taskReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Tasks by Status</h2>
                    <div className="h-80">
                      <Pie 
                        data={getTaskStatusChartData()} 
                        options={pieChartOptions} 
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Tasks by Category</h2>
                    <div className="h-80">
                      <Bar 
                        data={getTaskCategoryChartData()} 
                        options={chartOptions} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Task Creation Trend</h2>
                  <div className="h-80">
                    <Line 
                      data={{
                        labels: taskReport.tasksByDate.map(item => {
                          const date = new Date(item._id);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }),
                        datasets: [
                          {
                            label: 'New Tasks',
                            data: taskReport.tasksByDate.map(item => item.count),
                            fill: true,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            tension: 0.4
                          }
                        ]
                      }} 
                      options={chartOptions} 
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Earnings Reports */}
            {activeTab === 'earnings' && earningReport && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Platform Earnings Trend</h2>
                  <div className="h-80">
                    <Line 
                      data={getEarningsByDateChartData()} 
                      options={chartOptions} 
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Earnings by Category</h2>
                  <div className="h-80">
                    <Bar 
                      data={getEarningsByCategoryChartData()} 
                      options={chartOptions} 
                    />
                  </div>
                </div>
                
                {earningReport.earningsByCategory && earningReport.earningsByCategory.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Earnings by Category Details</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Earnings
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {earningReport.earningsByCategory.map((category, index) => {
                            const totalEarnings = earningReport.earningsByCategory.reduce((sum, cat) => sum + cat.earnings, 0);
                            const percentage = Math.round((category.earnings / totalEarnings) * 100);
                            
                            return (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {category._id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(category.earnings)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {percentage}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;