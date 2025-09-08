'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Button } from "./ui/button";
import { QRCodeData } from '@/types/qr';
import { toast } from 'sonner';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

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

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          const success = processQRCode(code.data);
          if (success) {
            stopScanner();
            return;
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanQRCode();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Could not access camera. Please check permissions.');
    }
  }, [scanQRCode]);

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner]);

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
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <div className="relative w-full max-w-md aspect-square bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover"
          style={{
            border: '3px solid #64748b',
            borderRadius: '0.5rem'
          }}
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
      
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(calc(100% - 4px)); }
          100% { transform: translateY(0); }
        }
        
        .scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0) 50%,
            rgba(255, 0, 0, 0.2) 50%,
            rgba(255, 0, 0, 0) 50.1%,
            rgba(0, 0, 0, 0) 100%
          );
          animation: scan 2s linear infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
