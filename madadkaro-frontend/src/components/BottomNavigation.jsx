import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  BriefcaseIcon,
  ClipboardIcon,
  UserIcon,
  PlusCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  ClipboardIcon as ClipboardIconSolid,
  UserIcon as UserIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid';

const BottomNavigation = () => {
  const { isAuthenticated, isTasker, isCustomer, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // If not authenticated, don't show bottom navigation
  if (!isAuthenticated()) {
    return null;
  }

  // Tasker navigation items
  if (isTasker()) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/') && location.pathname === '/' ? (
              <HomeIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <HomeIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/') && location.pathname === '/' ? 'text-primary-600 font-semibold' : ''}`}>
              Home
            </span>
          </Link>
          
          <Link
            to="/tasks"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/tasks') ? (
              <BriefcaseIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <BriefcaseIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/tasks') ? 'text-primary-600 font-semibold' : ''}`}>
              Tasks
            </span>
          </Link>
          
          <Link
            to="/my-bids"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/my-bids') ? (
              <ClipboardIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <ClipboardIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/my-bids') ? 'text-primary-600 font-semibold' : ''}`}>
              My Bids
            </span>
          </Link>
          
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/profile') ? (
              <UserIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/profile') ? 'text-primary-600 font-semibold' : ''}`}>
              Profile
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  // Customer navigation items
  if (isCustomer()) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/') && location.pathname === '/' ? (
              <HomeIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <HomeIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/') && location.pathname === '/' ? 'text-primary-600 font-semibold' : ''}`}>
              Home
            </span>
          </Link>
          
          <Link
            to="/post-task"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/post-task') ? (
              <PlusCircleIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <PlusCircleIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/post-task') ? 'text-primary-600 font-semibold' : ''}`}>
              Post Task
            </span>
          </Link>
          
          <Link
            to="/my-tasks"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/my-tasks') ? (
              <DocumentTextIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <DocumentTextIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/my-tasks') ? 'text-primary-600 font-semibold' : ''}`}>
              My Tasks
            </span>
          </Link>
          
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/profile') ? (
              <UserIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/profile') ? 'text-primary-600 font-semibold' : ''}`}>
              Profile
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  // Admin navigation items
  if (isAdmin()) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/admin/dashboard"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/admin/dashboard') ? (
              <HomeIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <HomeIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/admin/dashboard') ? 'text-primary-600 font-semibold' : ''}`}>
              Dashboard
            </span>
          </Link>
          
          <Link
            to="/admin/tasks"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/admin/tasks') ? (
              <DocumentTextIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <DocumentTextIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/admin/tasks') ? 'text-primary-600 font-semibold' : ''}`}>
              Tasks
            </span>
          </Link>
          
          <Link
            to="/admin/users"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/admin/users') ? (
              <UserIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/admin/users') ? 'text-primary-600 font-semibold' : ''}`}>
              Users
            </span>
          </Link>
          
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isActive('/profile') ? (
              <UserIconSolid className="h-6 w-6 text-primary-600" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
            <span className={`text-xs mt-1 ${isActive('/profile') ? 'text-primary-600 font-semibold' : ''}`}>
              Profile
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  return null;
};

export default BottomNavigation;

