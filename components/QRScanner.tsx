'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from "./ui/button";
import { useRouter } from 'next/navigation';
import { QRCodeData } from '@/types/qr';
import { BrowserQRCodeReader, NotFoundException } from '@zxing/browser';

interface QRScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let codeReader: BrowserQRCodeReader | null = null;

    const startScanner = async () => {
      try {
        // Initialize the QR code reader
        codeReader = new BrowserQRCodeReader();
        
        // Get the video stream
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Start decoding
          await codeReader.decodeFromVideoElement(
            videoRef.current,
            (result: any, err: any) => {
              if (result) {
                try {
                  let data: QRCodeData;
                  const text = result.getText();
                  
                  // Check if it's a URL with query parameters
                  if (text.startsWith('http')) {
                    const url = new URL(text);
                    data = {
                      tableId: url.searchParams.get('tableId') || '',
                      outletId: url.searchParams.get('outletId') || '',
                      outletName: url.searchParams.get('outletName') || undefined,
                      tableNumber: url.searchParams.get('tableNumber') || undefined
                    };
                  } else {
                    // Try to parse as JSON
                    data = JSON.parse(text);
                  }
                  
                  // Validate required fields
                  if (!data.tableId || !data.outletId) {
                    throw new Error('Invalid QR code: Missing required fields');
                  }
                  
                  setScanned(true);
                  onScanSuccess(data);
                  
                  // Stop all tracks
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                  }
                } catch (e) {
                  console.error('Error parsing QR code:', e);
                  setError('Invalid QR code format. Please scan a valid table QR code.');
                }
              }
              
              if (err && !(err instanceof NotFoundException)) {
                console.error('Scanning error:', err);
                setError('Error scanning QR code. Please try again.');
              }
            }
          );
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please ensure you have granted camera permissions.');
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  const handleManualEntry = () => {
    // For development/testing purposes only
    if (process.env.NODE_ENV === 'development') {
      const mockUrl = new URL('https://foodie-lake-five.vercel.app/');
      mockUrl.searchParams.set('tableId', 'T123');
      mockUrl.searchParams.set('outletId', 'O456');
      mockUrl.searchParams.set('outletName', 'Test Outlet');
      mockUrl.searchParams.set('tableNumber', '12');
      
      const mockData: QRCodeData = {
        tableId: 'T123',
        outletId: 'O456',
        outletName: 'Test Outlet',
        tableNumber: '12'
      };
      onScanSuccess(mockData);
    } else {
      setError('Please use the QR code scanner to proceed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h2 className="text-2xl font-bold mb-6">Scan Table QR Code</h2>
      
      <div className="w-full max-w-md aspect-square bg-black rounded-lg overflow-hidden mb-4 relative">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {scanned && (
          <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
            <p className="text-white font-bold text-lg">Success!</p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 mb-4 text-center">{error}</p>
      )}
      
      <div className="w-full max-w-md mt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleManualEntry}
        >
          Enter Manually (For Testing)
        </Button>
      </div>
      
      <p className="text-muted-foreground text-sm mt-6 text-center">
        Point your camera at the QR code on your table to get started
      </p>
    </div>
  );
}
