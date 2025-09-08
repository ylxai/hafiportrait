'use client';

import React from 'react';
import { MessageSquare, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseErrorBoundary from './BaseErrorBoundary';

interface GuestbookErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

function GuestbookErrorFallback({ onRetry }: { onRetry?: () => void }) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="w-full py-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-lg text-gray-800">
            Gagal Memuat Buku Tamu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            Terjadi kesalahan saat memuat atau mengirim pesan buku tamu.
          </p>
          
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-2">Yang bisa Anda lakukan:</p>
            <ul className="space-y-1">
              <li>• Periksa koneksi internet Anda</li>
              <li>• Coba muat ulang halaman</li>
              <li>• Tunggu beberapa saat dan coba lagi</li>
              <li>• Hubungi penyelenggara jika masalah berlanjut</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Muat Ulang Buku Tamu
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Pesan yang sudah dikirim sebelumnya tetap tersimpan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GuestbookErrorBoundary({ children, onRetry }: GuestbookErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Guestbook Error Boundary:', error, errorInfo);
    
    // Track guestbook specific errors
    // Example: analytics.track('guestbook_error', { error: error.message });
  };

  return (
    <BaseErrorBoundary
      fallback={<GuestbookErrorFallback onRetry={onRetry} />}
      onError={handleError}
    >
      {children}
    </BaseErrorBoundary>
  );
}