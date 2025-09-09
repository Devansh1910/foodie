import { useState, useEffect } from 'react';
import { MenuItem } from '@/types/menu';

interface MenuItemFormProps {
  initialData?: Partial<MenuItem>;
  onSubmit: (item: Omit<MenuItem, 'id'>) => Promise<{ success: boolean }>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

const defaultItem: Omit<MenuItem, 'id'> = {
  h: '',
  dp: 0,
  ct: 'MAIN COURSE',
  veg: true,
  wt: '',
  en: '',
  i: '',
};

export default function MenuItemForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting 
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>(defaultItem);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        h: initialData.h || '',
        dp: initialData.dp || 0,
        ct: initialData.ct || 'MAIN COURSE',
        veg: initialData.veg ?? true,
        wt: initialData.wt || '',
        en: initialData.en || '',
        i: initialData.i || '',
      });
    } else {
      setFormData(defaultItem);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.h.trim()) {
      setError('Item name is required');
      return;
    }
    
    if (formData.dp <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    
    const result = await onSubmit(formData);
    if (!result.success) {
      setError('Failed to save item. Please try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-semibold mb-4">
        {initialData?.id ? 'Edit Menu Item' : 'Add New Menu Item'}
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              name="h"
              value={formData.h}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Item name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (in paise) *</label>
            <input
              type="number"
              name="dp"
              value={formData.dp}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Price in paise"
              min="0"
              step="100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Displayed as: ₹{(formData.dp / 100).toFixed(2)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              name="ct"
              value={formData.ct}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            >
              <option value="BEVERAGES">Beverages</option>
              <option value="STARTERS">Starters</option>
              <option value="MAIN COURSE">Main Course</option>
              <option value="DESSERTS">Desserts</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="veg"
              value={formData.veg ? 'veg' : 'non-veg'}
              onChange={(e) => setFormData({...formData, veg: e.target.value === 'veg'})}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight/Portion</label>
            <input
              type="text"
              name="wt"
              value={formData.wt}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g., 250g or 2 pcs"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Calories</label>
            <input
              type="text"
              name="en"
              value={formData.en}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g., 350 kcal"
            />
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              name="i"
              value={formData.i}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="https://example.com/image.jpg"
            />
            
            {formData.i && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                <img 
                  src={formData.i} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://via.placeholder.com/100';
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {initialData?.id ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              initialData?.id ? 'Update Item' : 'Add Item'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
