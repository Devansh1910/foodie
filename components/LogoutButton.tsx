'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call the logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      
      if (response.ok) {
        // Clear client-side auth state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('isAuthenticated');
        }
        
        // Redirect to login page
        router.push('/admin');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 ${
        isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  );
}
