import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white pt-10 pb-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">MadadKaro</h3>
            <p className="text-gray-300 mb-4">
              Connecting customers with skilled taskers for everyday tasks.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-primary-300">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="text-white hover:text-primary-300">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-white hover:text-primary-300">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
              </li>
              <li>
                <Link to="/tasks" className="text-gray-300 hover:text-white">Browse Tasks</Link>
              </li>
              <li>
                <Link to="/post-task" className="text-gray-300 hover:text-white">Post a Task</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-300 hover:text-white">How It Works</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xl font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/tasks?category=cleaning" className="text-gray-300 hover:text-white">Cleaning</Link>
              </li>
              <li>
                <Link to="/tasks?category=handyman" className="text-gray-300 hover:text-white">Handyman</Link>
              </li>
              <li>
                <Link to="/tasks?category=delivery" className="text-gray-300 hover:text-white">Delivery</Link>
              </li>
              <li>
                <Link to="/tasks?category=technology" className="text-gray-300 hover:text-white">Technology</Link>
              </li>
              <li>
                <Link to="/tasks?category=other" className="text-gray-300 hover:text-white">Other</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                <i className="fas fa-map-marker-alt mr-2"></i> 123 Main Street, City, Country
              </li>
              <li className="text-gray-300">
                <i className="fas fa-phone mr-2"></i> +1 234 567 8901
              </li>
              <li className="text-gray-300">
                <i className="fas fa-envelope mr-2"></i> info@madadkaro.com
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-center text-gray-400">
          &copy; {currentYear} MadadKaro. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer; 