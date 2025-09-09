'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for the login page
      if (pathname === '/admin') {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/check', { credentials: 'same-origin' });
        const data = await response.json();
        
        if (!data.authenticated) {
          const redirectUrl = pathname === '/admin/dashboard' ? '' : `?redirect=${encodeURIComponent(pathname)}`;
          router.push(`/admin${redirectUrl}`);
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Don't show the layout on the login page
  if (pathname === '/admin') {
    return <>{children}</>;
  }

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
          <h1 className="text-xl font-bold">Foodie Admin</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, Admin</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
