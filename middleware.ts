import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/admin', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Skip middleware for public paths and API routes except auth
  if (isPublicPath || 
      request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin';
  
  // Redirect to login if trying to access admin routes without authentication
  if (isAdminPath && !isAuthenticated) {
    const loginUrl = new URL('/admin', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If already authenticated and trying to access login page, redirect to dashboard
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
