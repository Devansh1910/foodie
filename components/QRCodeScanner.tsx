'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

export function QRCodeScanner({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const initScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }

        // Initialize QR code scanner
        const codeReader = new (window as any).Zxing.BrowserQRCodeReader();
        
        codeReader.decodeFromVideoDevice(
          undefined,
          'video',
          (result: any, err: any) => {
            if (result) {
              handleScan(result.getText());
            }
            if (err && !(err instanceof (window as any).Zxing.NotFoundException)) {
              console.error(err);
              setError('Error scanning QR code. Please try again.');
            }
          }
        );

        return () => {
          stream.getTracks().forEach(track => track.stop());
          codeReader.reset();
        };
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please ensure you have granted camera permissions.');
        setHasPermission(false);
      }
    };

    // Load ZXing library
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js';
    script.async = true;
    script.onload = initScanner;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleScan = (url: string) => {
    if (scanned) return;
    
    try {
      // Handle both full URLs and just the path
      let path = url;
      if (url.startsWith('http')) {
        const urlObj = new URL(url);
        path = urlObj.pathname;
      }
      
      // Extract outlet ID and food category from path like /ac/200
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        throw new Error('Invalid QR code format');
      }
      
      const foodCategory = pathParts[0]; // 'ac' in /ac/200
      const outletId = pathParts[1];     // '200' in /ac/200
      
      if (!outletId || !foodCategory) {
        throw new Error('Missing outlet ID or food category in QR code');
      }
      
      setScanned(true);
      setLoading(true);
      
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Get address details using reverse geocoding
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
              );
              const data = await response.json();
              
              const address = data.address || {};
              const city = address.city || address.town || address.village || '';
              const state = address.state || '';
              
              // Redirect to food listing with all parameters
              router.push(
                `/${foodCategory}/${outletId}?lat=${latitude}&lon=${longitude}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`
              );
            } catch (err) {
              console.error('Error getting address:', err);
              // Redirect with just coordinates if address lookup fails
              router.push(`/${foodCategory}/${outletId}?lat=${latitude}&lon=${longitude}`);
            }
          },
          (err) => {
            console.error('Error getting location:', err);
            // Redirect without location if permission denied
            router.push(`/${foodCategory}/${outletId}`);
          }
        );
      } else {
        // Geolocation not supported
        router.push(`/${foodCategory}/${outletId}`);
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
      setError('Invalid QR code. Please scan a valid FoodieOS QR code.');
      setScanned(false);
      setLoading(false);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Camera Permission Required</h2>
          <p className="mb-4">
            Please enable camera permissions in your browser settings to scan QR codes.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Scan QR Code</h2>
          <p className="text-sm text-muted-foreground">
            Point your camera at a FoodieOS QR code
          </p>
        </div>
        
        <div className="relative aspect-square bg-black">
          <video
            id="video"
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
          />
          <div className="absolute inset-0 border-8 border-white/20 rounded-lg pointer-events-none" />
          
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <p className="text-white">Loading menu...</p>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="p-4 border-t flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Manual entry fallback
              const url = prompt('Enter the outlet URL:');
              if (url) handleScan(url);
            }}
          >
            Enter URL Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
