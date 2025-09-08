'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from "./ui/button";
import { useRouter } from 'next/navigation';
import { QRCodeData } from '@/types/qr';
import { BrowserQRCodeReader } from '@zxing/browser';
import { toast } from 'sonner';

interface QRScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const processQRCode = (text: string) => {
    try {
      // Handle URL format
      if (text.startsWith('http')) {
        const url = new URL(text);
        const tableId = url.searchParams.get('tableId');
        const outletId = url.searchParams.get('outletId');
        
        if (!tableId || !outletId) {
          throw new Error('Invalid QR: Missing required parameters');
        }
        
        const data: QRCodeData = {
          tableId,
          outletId,
          outletName: url.searchParams.get('outletName') || undefined,
          tableNumber: url.searchParams.get('tableNumber') || undefined
        };
        
        onScanSuccess(data);
        return true;
      }
      
      // Try to parse as JSON
      const data = JSON.parse(text);
      if (!data.tableId || !data.outletId) {
        throw new Error('Invalid QR: Missing required fields');
      }
      
      onScanSuccess(data);
      return true;
      
    } catch (error) {
      console.error('Invalid QR code:', error);
      toast.error('Invalid QR code. Please scan a valid table QR code.');
      return false;
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let codeReader: BrowserQRCodeReader | null = null;
    let isMounted = true;

    const startScanner = async () => {
      if (isScanning || !isMounted) return;
      
      setIsScanning(true);
      
      try {
        codeReader = new BrowserQRCodeReader();
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          
          await codeReader.decodeFromVideoElement(
            videoRef.current,
            (result, err) => {
              if (!isMounted) return;
              
              if (result) {
                const success = processQRCode(result.getText());
                if (success) {
                  // Stop scanning on success
                  stopScanner();
                }
              }
              
              if (err && !err.message?.includes('No QR code found')) {
                console.error('Scanning error:', err);
              }
            }
          );
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        toast.error('Could not access camera. Please check permissions.');
      }
    };
    
    const stopScanner = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsScanning(false);
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

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
      toast.error('Please use the QR code scanner to proceed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-square bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      </div>
      
      <p className="text-muted-foreground text-sm mt-6 text-center">
        Point your camera at the QR code on your table
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={handleManualEntry}
        >
          Enter Manually (Dev Only)
        </Button>
      )}
    </div>
  );
}
