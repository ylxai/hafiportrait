'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileInlineErrorProps {
  error?: Error | string | null;
  isRetrying?: boolean;
  canRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'minimal' | 'card' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function MobileInlineError({
  error,
  isRetrying = false,
  canRetry = true,
  onRetry,
  onDismiss,
  variant = 'card',
  size = 'md',
  showDetails = false,
  className
}: MobileInlineErrorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR

  useEffect(() => {
    // Set initial online status on client side
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network') || !isOnline;

  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'minimal') {
    return (
      <div className={cn(
        'flex items-center gap-2 text-red-600 bg-red-50 rounded-lg',
        sizeClasses[size],
        className
      )}>
        <AlertCircle className={iconSizes[size]} />
        <span className="flex-1 truncate">{errorMessage}</span>
        {canRetry && onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <RefreshCw className={cn('w-3 h-3', isRetrying && 'animate-spin')} />
          </Button>
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'bg-red-50 border-l-4 border-red-400',
        sizeClasses[size],
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isNetworkError ? (
              <WifiOff className={cn(iconSizes[size], 'text-red-500')} />
            ) : (
              <AlertCircle className={cn(iconSizes[size], 'text-red-500')} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-red-800">
              {isNetworkError ? 'Masalah Koneksi' : 'Terjadi Kesalahan'}
            </p>
            <p className="text-red-700 text-sm mt-1">
              {errorMessage}
            </p>
            
            {!isOnline && (
              <div className="flex items-center gap-1 mt-2">
                <WifiOff className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-600">Tidak ada koneksi internet</span>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 flex gap-1">
            {canRetry && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
                className="h-8 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
              >
                {isRetrying ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Coba Lagi
                  </>
                )}
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn('border-red-200 bg-red-50', className)}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isNetworkError ? (
              <WifiOff className={cn(iconSizes[size], 'text-red-500')} />
            ) : (
              <AlertCircle className={cn(iconSizes[size], 'text-red-500')} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-red-800 mb-1">
              {isNetworkError ? 'Masalah Koneksi' : 'Terjadi Kesalahan'}
            </h4>
            
            <p className="text-red-700 text-sm leading-relaxed">
              {errorMessage}
            </p>
            
            {/* Network Status */}
            <div className="flex items-center gap-2 mt-2">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">Terhubung</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600">Tidak terhubung</span>
                </>
              )}
            </div>
            
            {/* Expandable error details */}
            {showDetails && error instanceof Error && (
              <div className="mt-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Sembunyikan Detail
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Lihat Detail
                    </>
                  )}
                </button>
                
                {isExpanded && (
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded text-red-800 overflow-x-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
          
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {/* Action Buttons */}
        {(canRetry && onRetry) && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="bg-red-600 hover:bg-red-700 text-white h-8"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Mencoba...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Coba Lagi
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Network status indicator component
export function MobileNetworkStatus({ 
  className,
  showLabel = true 
}: { 
  className?: string;
  showLabel?: boolean;
}) {
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Set initial online status on client side
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div className={cn(
      'fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300',
      'px-3 py-2 rounded-full shadow-lg text-white text-xs font-medium',
      isOnline 
        ? 'bg-green-600' 
        : 'bg-red-600',
      className
    )}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {showLabel && (
          <span>
            {isOnline ? 'Kembali Online' : 'Tidak Ada Koneksi'}
          </span>
        )}
      </div>
    </div>
  );
}

// Error state for empty content
export function MobileEmptyError({
  title = "Tidak Ada Data",
  description = "Data belum tersedia saat ini.",
  icon: Icon = AlertCircle,
  onRetry,
  className
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <Icon className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-6 max-w-sm">{description}</p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="h-10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Muat Ulang
        </Button>
      )}
    </div>
  );
}