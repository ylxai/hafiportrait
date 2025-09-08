'use client';

import React from 'react';
import { Upload, AlertTriangle, RefreshCw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseErrorBoundary from './BaseErrorBoundary';

interface UploadErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  albumName?: string;
}

function UploadErrorFallback({ onRetry, albumName }: { onRetry?: () => void; albumName?: string }) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Clear any pending uploads and reset form
      window.location.reload();
    }
  };

  return (
    <div className="w-full py-4">
      <Card className="max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-2 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-red-600" />
          </div>
          <CardTitle className="text-base text-red-800">
            Gagal Upload Foto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-red-700 text-center text-sm">
            Terjadi kesalahan saat mengupload foto {albumName ? `ke album ${albumName}` : ''}.
          </p>
          
          <div className="bg-white p-3 rounded-lg text-xs text-gray-600 border border-red-200">
            <p className="font-medium mb-2 text-red-800">Kemungkinan penyebab:</p>
            <ul className="space-y-1">
              <li>• File terlalu besar (maksimal 10MB)</li>
              <li>• Format file tidak didukung</li>
              <li>• Koneksi internet terputus</li>
              <li>• Server sedang penuh</li>
              <li>• Kode akses tidak valid</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded-lg text-xs text-gray-600 border border-red-200">
            <p className="font-medium mb-2 text-green-800">Solusi:</p>
            <ul className="space-y-1">
              <li>• Pastikan file berformat JPG, PNG, atau WEBP</li>
              <li>• Kompres foto jika ukuran terlalu besar</li>
              <li>• Periksa koneksi internet</li>
              <li>• Coba upload satu per satu</li>
            </ul>
          </div>

          <Button
            onClick={handleRetry}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Upload Lagi
          </Button>
          
          <p className="text-xs text-red-600 text-center">
            Foto yang sudah berhasil diupload tidak akan hilang
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UploadErrorBoundary({ children, onRetry, albumName }: UploadErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Upload Error Boundary:', error, errorInfo);
    
    // Track upload specific errors with more context
    // Example: analytics.track('upload_error', { 
    //   albumName, 
    //   error: error.message,
    //   userAgent: navigator.userAgent,
    //   timestamp: new Date().toISOString()
    // });
  };

  return (
    <BaseErrorBoundary
      fallback={<UploadErrorFallback onRetry={onRetry} albumName={albumName} />}
      onError={handleError}
      resetKeys={[albumName as any]}
    >
      {children}
    </BaseErrorBoundary>
  );
}