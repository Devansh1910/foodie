'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import ImageUploader from '@/components/ImageUploader';

interface MenuItem {
  id: string;
  h: string;
  dp: number;
  ct: string;
  veg: boolean;
  wt: string;
  en: string;
  i: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({
    h: '',
    dp: 0,
    ct: 'MAIN COURSE',
    veg: true,
    wt: '',
    en: '',
    i: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://foodieos-786353173154.asia-south1.run.app/api/getOutletFood', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: 'web',
            country: 'India',
            city: 'Prayagraj',
            state: 'UP',
            lat: 25.4358,
            lon: 81.8463,
            outletid: 200,
            foodCategory: 'ALL',
            date: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch menu data');
        }

        const data = await response.json();
        
        if (data.status === 200 && data.output && data.output.foodList) {
          // Map the API response to our menu item format
          const formattedMenu = data.output.foodList.map((item: any) => ({
            id: item.id.toString(),
            h: item.name || 'No Name',
            dp: item.price || 0,
            ct: item.category || 'UNCATEGORIZED',
            veg: item.isVeg || false,
            wt: item.weight || '',
            en: item.calories || '',
            i: item.imageUrl || ''
          }));
          
          setMenuItems(formattedMenu);
          // Save to localStorage for offline access
          localStorage.setItem('menuItems', JSON.stringify(formattedMenu));
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
        // Fallback to localStorage if API fails
        const savedMenu = localStorage.getItem('menuItems');
        if (savedMenu) {
          setMenuItems(JSON.parse(savedMenu));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      setMenuItems(data.items || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItem = async () => {
    try {
      const itemToSave = editingId 
        ? { ...newItem, id: editingId }
        : { ...newItem, id: `${newItem.ct.substring(0, 1)}${String(menuItems.length + 1).padStart(3, '0')}` };

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemToSave),
      });

      if (response.ok) {
        await fetchMenuItems();
        setNewItem({
          h: '',
          dp: 0,
          ct: 'MAIN COURSE',
          veg: true,
          wt: '',
          en: '',
          i: ''
        });
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setNewItem({
      h: item.h,
      dp: item.dp,
      ct: item.ct,
      veg: item.veg,
      wt: item.wt,
      en: item.en,
      i: item.i
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/menu?id=${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchMenuItems();
        }
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const handleSync = async () => {
    try {
      setSyncStatus('Syncing with external API...');
      
      // Format the menu items for the API
      const formattedItems = menuItems.map(item => ({
        id: parseInt(item.id) || Date.now(),
        name: item.h,
        price: item.dp,
        category: item.ct,
        isVeg: item.veg,
        weight: item.wt,
        calories: item.en,
        imageUrl: item.i
      }));

      // Call the external API
      const response = await fetch('https://foodieos-786353173154.asia-south1.run.app/api/updateOutletFood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'web',
          outletid: 200,
          foodList: formattedItems
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync with external API');
      }

      const result = await response.json();
      if (result.status === 200) {
        setSyncStatus('Menu synced successfully!');
        // Update local storage with the synced data
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
      } else {
        throw new Error(result.msg || 'Failed to sync menu');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(`Error: ${error instanceof Error ? error.message : 'Failed to sync menu'}`);
    } finally {
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Foodie Admin Dashboard</h1>
          <LogoutButton />
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <div className="flex items-center space-x-4">
            {syncStatus && <span className="text-sm text-gray-600">{syncStatus}</span>}
            <button
              onClick={handleSync}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              disabled={syncStatus === 'Syncing...'}
            >
              {syncStatus === 'Syncing...' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : 'Sync Menu'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newItem.h}
                onChange={(e) => setNewItem({...newItem, h: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (in paise)</label>
              <input
                type="number"
                value={newItem.dp}
                onChange={(e) => setNewItem({...newItem, dp: Number(e.target.value)})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={newItem.ct}
                onChange={(e) => setNewItem({...newItem, ct: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                value={newItem.veg ? 'veg' : 'non-veg'}
                onChange={(e) => setNewItem({...newItem, veg: e.target.value === 'veg'})}
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
                value={newItem.wt}
                onChange={(e) => setNewItem({...newItem, wt: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="e.g., 250g or 2 pcs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Calories</label>
              <input
                type="text"
                value={newItem.en}
                onChange={(e) => setNewItem({...newItem, en: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="e.g., 350 kcal"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
              <ImageUploader 
                onUploadSuccess={(url) => setNewItem({...newItem, i: url})}
                currentImage={newItem.i}
              />
            </div>
            <div className="col-span-full">
              <div className="flex justify-end space-x-4">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewItem({
                        h: '',
                        dp: 0,
                        ct: 'MAIN COURSE',
                        veg: true,
                        wt: '',
                        en: '',
                        i: ''
                      });
                      setEditingId(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Add'} Item
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Menu Items</h3>
          {menuItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No menu items found. Add your first item above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.i && (
                          <img 
                            src={item.i} 
                            alt={item.h} 
                            className="h-12 w-12 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://via.placeholder.com/48';
                            }}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.h}</div>
                        <div className="text-sm text-gray-500">{item.wt}</div>
                        <div className="text-sm text-gray-500">{item.en}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.ct}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{(item.dp / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.veg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.veg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
