import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';

const Header = () => {
  const { currentUser, logout, isAuthenticated, isTasker, isCustomer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">MadadKaro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600">
              Home
            </Link>
            
            {isAuthenticated() ? (
              <>
                {isTasker() && (
                  <>
                    <Link to="/tasks" className="text-gray-700 hover:text-primary-600">
                      Browse Tasks
                    </Link>
                    <Link to="/my-bids" className="text-gray-700 hover:text-primary-600">
                      My Bids
                    </Link>
                  </>
                )}
                
                {isCustomer() && (
                  <>
                    <Link to="/post-task" className="text-gray-700 hover:text-primary-600">
                      Post a Task
                    </Link>
                    <Link to="/my-tasks" className="text-gray-700 hover:text-primary-600">
                      My Tasks
                    </Link>
                  </>
                )}
                
                {isAdmin() && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary-600">
                    Admin
                  </Link>
                )}
                
                {/* Notification Panel */}
                <NotificationPanel />
                
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                  >
                    <img 
                      src={currentUser.profilePicture || '/assets/images/avatar-placeholder.svg'} 
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>{currentUser.name}</span>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {isAuthenticated() && <NotificationPanel />}
            <button
              className="text-gray-700 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 space-y-3">
            <Link
              to="/"
              className="block text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {isAuthenticated() ? (
              <>
                {isTasker() && (
                  <>
                    <Link
                      to="/tasks"
                      className="block text-gray-700 hover:text-primary-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Browse Tasks
                    </Link>
                    <Link
                      to="/my-bids"
                      className="block text-gray-700 hover:text-primary-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Bids
                    </Link>
                  </>
                )}
                
                {isCustomer() && (
                  <>
                    <Link
                      to="/post-task"
                      className="block text-gray-700 hover:text-primary-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Post a Task
                    </Link>
                    <Link
                      to="/my-tasks"
                      className="block text-gray-700 hover:text-primary-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Tasks
                    </Link>
                  </>
                )}
                
                {isAdmin() && (
                  <Link
                    to="/admin/dashboard"
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                
                <Link
                  to="/profile"
                  className="block text-gray-700 hover:text-primary-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left text-gray-700 hover:text-primary-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-gray-700 hover:text-primary-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block btn-primary w-full text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 