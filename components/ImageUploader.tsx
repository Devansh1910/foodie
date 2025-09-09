'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from './ui/button';
import { Loader2, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImage?: string;
}

export default function ImageUploader({ onUploadSuccess, currentImage }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Upload to Cloudinary
    await uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      onUploadSuccess(url);
    } catch (error) {
      console.error('Upload error:', error);
      // Revert preview on error
      setPreviewUrl(null);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-8 h-8 mb-2 text-gray-500 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
            )}
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, or WEBP (MAX. 5MB)</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            ref={fileInputRef}
            disabled={isUploading}
          />
        </label>
      </div>

      {previewUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <div className="relative w-32 h-32 rounded-md overflow-hidden border border-gray-200">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setPreviewUrl('/placeholder-food.jpg')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
