import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/types/menu';

const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      return { success: true };
    } catch (err) {
      console.error('Error deleting menu item:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete item' };
    }
  };

  const syncMenu = async (items: MenuItem[]) => {
    try {
      const response = await fetch('/api/sync', {
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
