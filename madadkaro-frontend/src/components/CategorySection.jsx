import React from 'react';
import { useSelector } from 'react-redux';
import CategoryCard from './CategoryCard';
import { selectCategories, selectCategoriesLoading } from '../store/slices/tasksSlice';

const CategorySection = ({ locationData, popularCategories = [], userRole = 'tasker' }) => { // Added userRole prop
  const categories = useSelector(selectCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  // Check if a category is popular based on its slug or ID
  const isPopularCategory = (category) => {
    // Assuming popularCategories is an array of slugs or IDs
    return popularCategories.includes(category.slug) || popularCategories.includes(category._id);
  };

  if (categoriesLoading) {
    return (
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Find Tasks by Category</h2>
          <p className="text-primary-600 max-w-2xl mx-auto">
            Loading categories...
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Find Tasks by Category</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
          <p className="text-gray-600">
            We couldn't find any task categories at the moment. Please check back later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Find Tasks by Category</h2>
        <p className="text-primary-600 max-w-2xl mx-auto">
          Browse tasks by category to find work that matches your skills or services you need.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <CategoryCard 
            key={category._id}
            category={category}
            locationData={locationData}
            isPopular={isPopularCategory(category)}
            userRole={userRole} // Pass userRole to CategoryCard
          />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;