'use client';

import React from 'react';
import { Calendar, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseErrorBoundary from './BaseErrorBoundary';

interface EventErrorBoundaryProps {
  children: React.ReactNode;
  eventId?: string;
  onRetry?: () => void;
}

function EventErrorFallback({ eventId, onRetry }: { eventId?: string; onRetry?: () => void }) {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-wedding-ivory flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-800 mb-2">
            Gagal Memuat Event
          </CardTitle>
          <p className="text-gray-600">
            Terjadi kesalahan saat memuat halaman event. Ini mungkin karena:
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              Event tidak ditemukan atau telah dihapus
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              Koneksi internet bermasalah
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              Server sedang mengalami gangguan
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              Link event tidak valid
            </li>
          </ul>

          {eventId && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Event ID:</strong> {eventId}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-wedding-gold hover:bg-wedding-gold/90 text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Beranda
              </Button>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Jika masalah berlanjut, silakan hubungi penyelenggara event
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventErrorBoundary({ children, eventId, onRetry }: EventErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error untuk debugging
    console.error('Event Error Boundary:', error, errorInfo);
    
    // Dalam production, kirim ke error reporting service
    // Example: Sentry.captureException(error, { 
    //   tags: { component: 'EventPage', eventId },
    //   contexts: { react: errorInfo }
    // });
  };

  return (
    <BaseErrorBoundary
      fallback={<EventErrorFallback eventId={eventId} onRetry={onRetry} />}
      onError={handleError}
      resetKeys={[eventId as any]}
      resetOnPropsChange={eventId as any}
    >
      {children}
    </BaseErrorBoundary>
  );
}