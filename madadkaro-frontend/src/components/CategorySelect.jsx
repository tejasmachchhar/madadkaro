import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const CategorySelect = ({ 
  selectedCategory, 
  selectedSubcategory, 
  onCategoryChange, 
  onSubcategoryChange 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  
  // Use refs to track previous values
  const prevCategoryRef = useRef(selectedCategory);
  const prevSubcategoryRef = useRef(selectedSubcategory);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        setCategories(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []); // Only run on mount

  // Update subcategories when category changes
  useEffect(() => {
    // Skip the effect if nothing has changed
    if (selectedCategory === prevCategoryRef.current && 
        selectedSubcategory === prevSubcategoryRef.current) {
      return;
    }
    
    // Update refs with current values for next render comparison
    prevCategoryRef.current = selectedCategory;
    prevSubcategoryRef.current = selectedSubcategory;
    
    if (selectedCategory) {
      const category = categories.find(cat => cat._id === selectedCategory);
      if (category && category.subcategories) {
        setSubcategories(category.subcategories);
        
        // Reset subcategory selection when category changes
        if (selectedSubcategory) {
          const subcategoryExists = category.subcategories.some(
            sub => sub._id === selectedSubcategory
          );
          
          if (!subcategoryExists) {
            onSubcategoryChange('');
          }
        }
      } else {
        setSubcategories([]);
        if (selectedSubcategory) {
          onSubcategoryChange('');
        }
      }
    } else {
      setSubcategories([]);
      if (selectedSubcategory) {
        onSubcategoryChange('');
      }
    }
  }, [selectedCategory, categories, selectedSubcategory]); // Remove onSubcategoryChange from deps

  // Handle category change
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    onCategoryChange(categoryId);
    setSelectedPriceRange(null);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    onSubcategoryChange(subcategoryId);
    
    const selectedSub = subcategories.find(sub => sub._id === subcategoryId);
    setSelectedPriceRange(selectedSub?.priceRange || null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Category*</label>
        <select
          name="category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedCategory && (
        <div>
          <label className="block text-gray-700 font-medium mb-2">Subcategory*</label>
          <select
            name="subcategory"
            value={selectedSubcategory}
            onChange={handleSubcategoryChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a subcategory</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory._id} value={subcategory._id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          {selectedPriceRange && (
            <p className="mt-2 text-sm text-gray-600">
              Estimated Price Range: ₹{selectedPriceRange.min} - ₹{selectedPriceRange.max}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelect;