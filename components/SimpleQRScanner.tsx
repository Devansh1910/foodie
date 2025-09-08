'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from "./ui/button";
import { QRCodeData } from '@/types/qr';
import { toast } from 'sonner';

interface QRScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
}

export default function SimpleQRScanner({ onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);

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
    const video = videoRef.current;
    if (!video) return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        video.srcObject = stream;
        await video.play();
        setIsScanning(true);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        const tick = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // @ts-ignore - jsQR will be loaded dynamically
            if (window.jsQR) {
              // @ts-ignore
              const code = window.jsQR(imageData.data, imageData.width, imageData.height);
              if (code) {
                processQRCode(code.data);
              }
            }
          }
          animationFrameId = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error('Error accessing camera:', err);
        toast.error('Could not access camera. Please check permissions.');
      }
    };

    // Load jsQR dynamically
    const loadJsQR = () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      script.onload = startScanner;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    loadJsQR();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, []);

  const handleManualEntry = () => {
    if (process.env.NODE_ENV === 'development') {
      const mockData = {
        tableId: 'T123',
        outletId: 'O456',
        outletName: 'Test Restaurant',
        tableNumber: '12'
      };
      onScanSuccess(mockData);
    } else {
      toast.error('Please use the QR code scanner to proceed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <div className="relative w-full max-w-md aspect-square bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      </div>
      
      <p className="text-muted-foreground text-sm mt-6 text-center max-w-xs">
        Point your camera at the QR code on your table to scan and order
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={handleManualEntry}
        >
          Enter Manually (Dev Only)
        </Button>
      )}
    </div>
  );
}
