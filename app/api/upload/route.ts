import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to base64
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder: 'foodie-menu', // Optional: Create a folder in Cloudinary
          resource_type: 'auto',
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
            return;
          }
          resolve(result);
        }
      );
    });

    return NextResponse.json({
      url: (result as any).secure_url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
