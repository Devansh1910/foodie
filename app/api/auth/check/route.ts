import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const isAuthenticated = cookies().get('isAuthenticated')?.value === 'true';
    
    if (isAuthenticated) {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
