import { NextResponse } from 'next/server';

// In-memory storage for demo purposes
let menuItems: any[] = [];

export async function GET() {
  return NextResponse.json({ items: menuItems });
}

export async function POST(request: Request) {
  try {
    const item = await request.json();
    const existingIndex = menuItems.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      menuItems[existingIndex] = item;
    } else {
      // Add new item
      menuItems.push(item);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    menuItems = menuItems.filter(item => item.id !== id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}

// For development: Add sample data if empty
if (process.env.NODE_ENV === 'development' && menuItems.length === 0) {
  menuItems = [
    {
      id: 'M001',
      h: 'Butter Chicken',
      dp: 45000,
      ct: 'MAIN COURSE',
      veg: false,
      wt: '500 g',
      en: '600 kcal',
      i: 'https://source.unsplash.com/400x300/?butter-chicken'
    },
    {
      id: 'D001',
      h: 'Gulab Jamun',
      dp: 12000,
      ct: 'DESSERTS',
      veg: true,
      wt: '2 pcs',
      en: '250 kcal',
      i: 'https://source.unsplash.com/400x300/?gulab-jamun'
    }
  ];
}
