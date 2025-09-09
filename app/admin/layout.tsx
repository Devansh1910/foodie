'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for the login page
    if (pathname === '/admin') return;
    
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined' && !localStorage.getItem('isAuthenticated')) {
      router.push('/admin');
    }
  }, [pathname, router]);

  // Don't show the layout on the login page
  if (pathname === '/admin') {
    return <>{children}</>;
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
