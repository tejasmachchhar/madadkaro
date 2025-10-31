import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
      <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        You do not have permission to access this page. Please log in with the appropriate account or contact support for assistance.
      </p>
      <div className="flex space-x-4">
        <Link to="/" className="btn-primary px-8 py-3">
          Go Home
        </Link>
        <Link to="/login" className="btn-outline px-8 py-3">
          Login
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 