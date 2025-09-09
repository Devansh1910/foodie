import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    // In a real app, you would validate the credentials against a database
    if (username === 'Devansh' && password === 'Devansh@1234554321@@') {
      // Set an HTTP-only cookie for authentication
      cookies().set('isAuthenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
