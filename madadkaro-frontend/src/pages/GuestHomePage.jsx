import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTasks } from '../hooks/useTasks';
import HomeLocationSelector from '../components/HomeLocationSelector';
import CategoryCard from '../components/CategoryCard';

const GuestHomePage = () => {
  const navigate = useNavigate();
  const { categories } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationData, setLocationData] = useState(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [popularCategories] = useState(['cleaning', 'handyman', 'delivery']);

  // Check if we have a previously saved location
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocationData(parsedLocation);
        setIsLocationConfirmed(true);
      } catch (error) {
        console.error('Failed to parse saved location:', error);
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  const handleLocationSelect = (location) => {
    setLocationData(location);
    setIsLocationConfirmed(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!isLocationConfirmed) {
      toast.warn('Please select your location first');
      return;
    }
    
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('keyword', searchQuery);
    }
    
    if (locationData) {
      params.append('location', locationData.address);
      if (locationData.lat && locationData.lng) {
        params.append('lat', locationData.lat);
        params.append('lng', locationData.lng);
      }
    }
    
    navigate(`/tasks?${params.toString()}`);
  };

  // Check if a category is popular
  const isPopularCategory = (categoryId) => {
    return popularCategories.includes(categoryId);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20 rounded-lg mb-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">
            Find Help for Any Task, <br /> Anywhere in India
          </h1>
          <p className="text-xl mb-6 max-w-3xl mx-auto">
            MadadKaro connects you with skilled taskers to help with cleaning, handyman work, 
            moving, deliveries, and more.
          </p>
          
          {/* Location Selector - New Component */}
          <div className="max-w-2xl mx-auto mb-6">
            <HomeLocationSelector 
              onLocationSelect={handleLocationSelect}
              initialLocation={locationData}
            />
          </div>
          
          {/* Search Form - Only shown after location is confirmed */}
          {isLocationConfirmed && (
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you need help with?"
                  className="w-full px-4 py-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-400 text-primary-900"
                />
                <button 
                  type="submit" 
                  className="bg-secondary-600 hover:bg-secondary-700 px-6 py-3 rounded-r-md transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register?role=customer" className="btn-secondary px-8 py-3 text-lg">
              I need a Tasker
            </Link>
            <Link to="/register?role=tasker" className="bg-white text-primary-700 hover:bg-primary-100 px-8 py-3 rounded-md text-lg transition-colors">
              Become a Tasker
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section - Updated with New Component */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Browse Tasks by Category</h2>
          <p className="text-primary-600 max-w-2xl mx-auto">
            Choose a category below to find tasks in your area. Each category shows an estimated price range.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id}
              category={category}
              locationData={locationData}
              isPopular={isPopularCategory(category.id)}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16 bg-gray-50 py-16 -mx-4 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How MadadKaro Works</h2>
            <p className="text-primary-600 max-w-2xl mx-auto">
              Getting help is quick and easy with our straightforward process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Post Your Task</h3>
              <p className="text-primary-600">
                Describe what you need help with, when you need it done, and how much you're willing to pay.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Get Offers</h3>
              <p className="text-primary-600">
                Receive offers from skilled taskers willing to help with your task.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Choose & Get It Done</h3>
              <p className="text-primary-600">
                Select the best tasker for your job and get your task completed to your satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Our Platform */}
      <section className="mb-16 bg-primary-50 py-16 -mx-4 px-4 rounded-lg">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Platform Today</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Choose your role and get started with MadadKaro in minutes.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-2xl font-bold mb-3">I Need Help With Tasks</h3>
              <p className="mb-6">
                Post tasks and find reliable help for cleaning, repairs, moving, and more.
              </p>
              <Link to="/register?role=customer" className="btn-primary w-full py-3">
                Sign Up as a Customer
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-2xl font-bold mb-3">I Want to Complete Tasks</h3>
              <p className="mb-6">
                Use your skills to help others and earn money on your own schedule.
              </p>
              <Link to="/register?role=tasker" className="btn-secondary w-full py-3">
                Sign Up as a Tasker
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuestHomePage; 