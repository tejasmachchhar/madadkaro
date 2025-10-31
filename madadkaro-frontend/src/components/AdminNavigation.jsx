import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/outline';

const AdminNavigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm lg:sticky lg:top-20">
      <div className="p-4 flex justify-between items-center lg:block">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        <button
          onClick={toggleMenu}
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        >
          <span className="sr-only">Open menu</span>
          {isMenuOpen ? (
            <XIcon className="block h-6 w-6" />
          ) : (
            <MenuIcon className="block h-6 w-6" />
          )}
        </button>
      </div>
      
      <nav className={`${isMenuOpen ? 'block' : 'hidden'} lg:block p-4 space-y-2`}>
        <Link
          to="/admin/dashboard"
          onClick={() => setIsMenuOpen(false)}
          className={`block px-4 py-2 rounded-lg transition ${isActive('/admin/dashboard') 
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Dashboard
        </Link>
        
        <Link
          to="/admin/categories"
          onClick={() => setIsMenuOpen(false)}
          className={`block px-4 py-2 rounded-lg transition ${isActive('/admin/categories')
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Manage Categories
        </Link>
        
        <Link
          to="/admin/users"
          onClick={() => setIsMenuOpen(false)}
          className={`block px-4 py-2 rounded-lg transition ${isActive('/admin/users')
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Manage Users
        </Link>
        
        <Link
          to="/admin/tasks"
          onClick={() => setIsMenuOpen(false)}
          className={`block px-4 py-2 rounded-lg transition ${isActive('/admin/tasks')
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Manage Tasks
        </Link>
        
        <Link
          to="/admin/reports"
          onClick={() => setIsMenuOpen(false)}
          className={`block px-4 py-2 rounded-lg transition ${isActive('/admin/reports')
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Reports & Analytics
        </Link>

        <Link
          to="/admin/fees"
          onClick={() => setIsMenuOpen(false)}
          className={`block px-4 py-2 rounded-lg transition ${isActive('/admin/fees')
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Platform Fees
        </Link>
      </nav>
    </div>
  );
};

export default AdminNavigation;