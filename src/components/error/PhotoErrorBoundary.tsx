'use client';

import React from 'react';
import { Camera, AlertTriangle, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseErrorBoundary from './BaseErrorBoundary';

interface PhotoErrorBoundaryProps {
  children: React.ReactNode;
  albumName?: string;
  onRetry?: () => void;
}

function PhotoErrorFallback({ albumName, onRetry }: { albumName?: string; onRetry?: () => void }) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="w-full py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-lg text-gray-800">
            Gagal Memuat Foto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            Terjadi kesalahan saat memuat foto {albumName ? `album ${albumName}` : ''}.
          </p>
          
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-2">Kemungkinan penyebab:</p>
            <ul className="space-y-1">
              <li>• Koneksi internet tidak stabil</li>
              <li>• Server foto sedang bermasalah</li>
              <li>• File foto rusak atau tidak valid</li>
            </ul>
          </div>

          <Button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang Foto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PhotoErrorBoundary({ children, albumName, onRetry }: PhotoErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Photo Error Boundary:', error, errorInfo);
    
    // Log specific photo errors
    // Example: analytics.track('photo_error', { albumName, error: error.message });
  };

  return (
    <BaseErrorBoundary
      fallback={<PhotoErrorFallback albumName={albumName} onRetry={onRetry} />}
      onError={handleError}
      resetKeys={[albumName as any]}
    >
      {children}
    </BaseErrorBoundary>
  );
}