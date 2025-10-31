import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    icon: '', 
    description: '',
    parentCategory: '',
    priceRange: { min: 0, max: 0 }
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [mainCategories, setMainCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'sub'
  
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter main categories (those without parent) for dropdown selection
    if (categories.length > 0) {
      const mains = categories.filter(cat => !cat.parentCategory);
      setMainCategories(mains);
    }
  }, [categories]);
  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      const response = await api.post('/categories', {
        ...newCategory,
        priceRange: newCategory.priceRange
      });
      
      setCategories([...categories, response.data]);
      setNewCategory({ 
        name: '', 
        icon: '', 
        description: '',
        parentCategory: '' 
      });
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Error creating category:', error);
    }
  };
  
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      // Updating category on the server
      const response = await api.put(`/categories/${editingCategory._id}`, {
        name: editingCategory.name,
        icon: editingCategory.icon,
        description: editingCategory.description,
        parentCategory: editingCategory.parentCategory || null,
        priceRange: editingCategory.priceRange
      });

      // Updating category state
      setCategories(categories.map(cat => {
        if (editingCategory.parentCategory && cat._id === editingCategory.parentCategory) {
          return {
            ...cat,
            subcategories: cat.subcategories.map(sub => 
              sub._id === editingCategory._id ? response.data : sub
            )
          };
        } else if (!editingCategory.parentCategory && cat._id === editingCategory._id) {
          return response.data;
        }
        return cat;
      }));
      
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.delete(`/categories/${categoryToDelete._id}`);
      
      setCategories(categories.filter(cat => cat._id !== categoryToDelete._id));
      setCategoryToDelete(null);
      setShowDeleteModal(false);
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };
  
  const startEdit = (category) => {
    setEditingCategory({ 
      ...category,
      priceRange: category.priceRange || { min: 0, max: 0 }
    });
  };
  
  const cancelEdit = () => {
    setEditingCategory(null);
  };
  
  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  // Get category name by ID for display
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : 'None';
  };

  // Get subcategories for a main category
  const getSubcategories = (categoryId) => {
    const filteredCategory = categories.filter(cat => cat._id === categoryId)[0];
    return filteredCategory.subcategories;
  };

  // Get all subcategories (categories with a parent)
  const getAllSubcategories = () => {
    return categories.map(cat => cat.subcategories).flat(); 
  };
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'main' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('main')}
        >
          Main Categories
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'sub' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('sub')}
        >
          Subcategories
        </button>
      </div>

      {/* Create Category Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Create New {activeTab === 'main' ? 'Main Category' : 'Subcategory'}
        </h2>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>
          
          <div>
            <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="categoryDescription"
              value={newCategory.description || ''}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category description"
            />
          </div>
          
          <div>
            <label htmlFor="categoryIcon" className="block text-sm font-medium text-gray-700 mb-1">
              Icon (FontAwesome class or URL)
            </label>
            <input
              type="text"
              id="categoryIcon"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="fa-home or image URL"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                id="minPrice"
                value={newCategory.priceRange.min}
                onChange={(e) => setNewCategory({ 
                  ...newCategory, 
                  priceRange: { ...newCategory.priceRange, min: Number(e.target.value) } 
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum price"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                id="maxPrice"
                value={newCategory.priceRange.max}
                onChange={(e) => setNewCategory({ 
                  ...newCategory, 
                  priceRange: { ...newCategory.priceRange, max: Number(e.target.value) } 
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maximum price"
              />
            </div>
          </div>
          
          {activeTab === 'sub' && (
            <div>
              <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select
                id="parentCategory"
                value={newCategory.parentCategory}
                onChange={(e) => setNewCategory({ ...newCategory, parentCategory: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="" disabled>Select a parent category</option>
                {mainCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition"
            >
              Create {activeTab === 'main' ? 'Main Category' : 'Subcategory'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Manage {activeTab === 'main' ? 'Main Categories' : 'Subcategories'}
        </h2>
        
        {loading ? (
          <p className="text-gray-600 text-center">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-600 text-center">No categories found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Range
                  </th>
                  {activeTab === 'main' ? (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subcategories
                    </th>
                  ) : (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Category
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === 'main' ? mainCategories : getAllSubcategories()).map((category) => (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory && editingCategory._id === category._id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory && editingCategory._id === category._id ? (
                        <input
                          type="text"
                          value={editingCategory.description || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{category.description || 'No description'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory && editingCategory._id === category._id ? (
                        <input
                          type="text"
                          value={editingCategory.icon || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{category.icon || 'No icon'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory && editingCategory._id === category._id ? (
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={editingCategory.priceRange.min}
                            onChange={(e) => setEditingCategory({ 
                              ...editingCategory, 
                              priceRange: { ...editingCategory.priceRange, min: Number(e.target.value) } 
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            value={editingCategory.priceRange.max}
                            onChange={(e) => setEditingCategory({ 
                              ...editingCategory, 
                              priceRange: { ...editingCategory.priceRange, max: Number(e.target.value) } 
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                            placeholder="Max"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {category.priceRange ? `${category.priceRange.min} - ${category.priceRange.max}` : 'Not set'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeTab === 'main' ? (
                        // For main categories, show subcategory count
                        <div className="text-sm text-gray-500">
                          {getSubcategories(category._id).length} subcategories
                        </div>
                      ) : editingCategory && editingCategory._id === category._id ? (
                        // For subcategories in edit mode, show parent selection
                        <select
                          value={editingCategory.parentCategory || ''}
                          onChange={(e) => setEditingCategory({ 
                            ...editingCategory, 
                            parentCategory: e.target.value === '' ? null : e.target.value 
                          })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="">None (Main Category)</option>
                          {mainCategories
                            .filter(cat => cat._id !== category._id) // Prevent self-reference
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))
                          }
                        </select>
                      ) : (
                        // For subcategories in view mode, show parent name
                        <div className="text-sm text-gray-500">
                          {category.parentCategory ? 
                            getCategoryName(category.parentCategory) : 
                            'None (Main Category)'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingCategory && editingCategory._id === category._id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateCategory}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-4">
                          <button
                            onClick={() => startEdit(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(category)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the category "{categoryToDelete?.name}"? This may affect existing tasks.
              {categories.some(cat => cat.parentCategory === categoryToDelete?._id) && (
                <span className="text-red-600 block mt-2">
                  Warning: This category has subcategories. Delete them first or reassign them.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;