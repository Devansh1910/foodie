import { MenuItem } from '@/types/menu';
import Image from 'next/image';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

export default function MenuItemCard({ item, onEdit, onDelete, isAdmin = true }: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-100">
        <Image
          src={item.i || '/placeholder-food.jpg'}
          alt={item.h}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '/placeholder-food.jpg';
          }}
        />
        <div className="absolute top-2 left-2">
          <span 
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              item.veg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {item.veg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>
        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
          {item.ct}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.h}</h3>
          <span className="text-lg font-bold text-gray-900">₹{(item.dp / 100).toFixed(2)}</span>
        </div>
        
        {(item.wt || item.en) && (
          <div className="mt-1 text-sm text-gray-600 space-y-1">
            {item.wt && <div>Portion: {item.wt}</div>}
            {item.en && <div>Calories: {item.en}</div>}
          </div>
        )}
        
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
