import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin';
  
  // Allow access to the login page if not authenticated
  if (isLoginPage && !isAuthenticated) {
    return NextResponse.next();
  }
  
  // Redirect to login if trying to access admin routes without authentication
  if (isAdminPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // If already authenticated and trying to access login page, redirect to dashboard
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
