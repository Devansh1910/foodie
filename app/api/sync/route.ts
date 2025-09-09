import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { items, cat } = await request.json();
    
    // Here you would typically sync with your actual database or external API
    console.log('Syncing menu items:', { items, cat });
    
    // For demo purposes, we'll just return success
    return NextResponse.json({ message: 'Data synced successfully' });
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}
