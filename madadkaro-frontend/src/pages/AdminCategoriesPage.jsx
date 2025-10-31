import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminNavigation from '../components/AdminNavigation';
import CategoryManager from '../components/CategoryManager';

const AdminCategoriesPage = () => {
  const { isAdmin } = useAuth();

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
            <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
            <p className="text-gray-600">Manage platform categories for tasks</p>
          </div>
          
          <CategoryManager />
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;