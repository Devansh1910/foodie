import { useState, useEffect, useCallback } from 'react';
import { MenuItem, MenuCategory, MenuData } from '@/types/menu';

const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const fetchMenuItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/menu');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching menu items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncMenu = async (items: MenuItem[]) => {
    setIsSyncing(true);
    setSyncStatus('Syncing...');
    
    try {
      const formattedItems = items.map(item => ({
        id: item.id,
        h: item.name,
        dp: item.price,
        ct: item.category,
        veg: item.veg,
        wt: item.weight,
        en: item.calories,
        i: item.imageUrl
      }));

      const response = await fetch('https://foodie-backend-786353173154.us-central1.run.app/api/updateOutletFood?outletid=200', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 200,
          code: 10001,
          result: "success",
          msg: "",
          output: {
            outletName: "Spice Garden Mumbai",
            city: { id: 200, name: "Mumbai", state: "Maharashtra" },
            r: formattedItems
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync menu');
      }

      const result = await response.json();
      setSyncStatus('Menu synced successfully!');
      return result;
    } catch (error) {
      console.error('Error syncing menu:', error);
      setSyncStatus('Error syncing menu');
      throw error;
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const saveMenuItem = async (item: Omit<MenuItem, 'id'> & { id?: string }) => {
    try {
      const isNew = !item.id;
      const itemToSave = isNew
        ? { ...item, id: `${item.ct.substring(0, 1)}${String(menuItems.length + 1).padStart(3, '0')}` }
        : item;

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save menu item');
      }

      await fetchMenuItems();
      await syncMenu([...menuItems.filter(i => i.id !== item.id), itemToSave]);
      return { success: true, isNew };
    } catch (err) {
      console.error('Error saving menu item:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save item' };
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const response = await fetch(`/api/menu?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      await fetchMenuItems();
      await syncMenu(menuItems.filter(item => item.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting menu item:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete item' };
    }
  };

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          cat: ['BEVERAGES', 'STARTERS', 'MAIN COURSE', 'DESSERTS'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync menu');
      }

      return { success: true };
    } catch (err) {
      console.error('Error syncing menu:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to sync menu' 
      };
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  return {
    menuItems,
    isLoading,
    error,
    fetchMenuItems,
    saveMenuItem,
    deleteMenuItem,
    syncMenu,
  };
};

export default useMenu;
