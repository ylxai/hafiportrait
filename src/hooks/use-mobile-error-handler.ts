'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  isOffline: boolean;
  lastErrorTime: number;
}

interface MobileErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  showToasts?: boolean;
  autoRetry?: boolean;
  offlineMessage?: string;
  retryMessage?: string;
}

export function useMobileErrorHandler(options: MobileErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    showToasts = true,
    autoRetry = true,
    offlineMessage = "Tidak ada koneksi internet. Mencoba kembali...",
    retryMessage = "Terjadi kesalahan. Mencoba lagi..."
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
    isOffline: false, // Always false on SSR, will be updated in useEffect
    lastErrorTime: 0
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const offlineQueueRef = useRef<(() => Promise<any>)[]>([]);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      setErrorState(prev => ({ ...prev, isOffline: false }));
      if (showToasts) {
        toast({
          title: "Koneksi Tersambung",
          description: "Internet kembali aktif. Memuat ulang data...",
          duration: 2000,
        });
      }
      // Process offline queue
      processOfflineQueue();
    };

    const handleOffline = () => {
      setErrorState(prev => ({ ...prev, isOffline: true }));
      if (showToasts) {
        toast({
          title: "Koneksi Terputus",
          description: offlineMessage,
          variant: "destructive",
          duration: 3000,
        });
      }
    };

    // Initial check - only on client side
    if (typeof window !== 'undefined') {
      setErrorState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    }

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [showToasts, offlineMessage]);

  // Process queued requests when back online
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueueRef.current.length === 0) return;

    const queue = [...offlineQueueRef.current];
    offlineQueueRef.current = [];

    for (const request of queue) {
      try {
        await request();
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }, []);

  // Enhanced error handler with mobile-specific features
  const handleError = useCallback(async (
    error: Error | unknown,
    retryFunction?: () => Promise<any>,
    context?: string
  ) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const now = Date.now();

    // Update error state
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error: errorObj,
      lastErrorTime: now
    }));

    // Detect network errors
    const isNetworkError = 
      errorObj.message.includes('fetch') ||
      errorObj.message.includes('NetworkError') ||
      errorObj.message.includes('Failed to fetch') ||
      errorObj.name === 'TypeError';

    // Handle offline scenarios
    if (!navigator.onLine || isNetworkError) {
      if (retryFunction) {
        offlineQueueRef.current.push(retryFunction);
      }
      
      if (showToasts) {
        toast({
          title: "Tidak Ada Koneksi",
          description: "Permintaan akan diproses saat koneksi kembali.",
          variant: "destructive",
          duration: 4000,
        });
      }
      return;
    }

    // Auto retry logic
    if (autoRetry && retryFunction && errorState.retryCount < maxRetries) {
      await attemptRetry(retryFunction, context);
    } else {
      // Show final error message
      if (showToasts) {
        toast({
          title: "Terjadi Kesalahan",
          description: context ? `${context}: ${errorObj.message}` : errorObj.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  }, [errorState.retryCount, maxRetries, autoRetry, showToasts]);

  // Retry mechanism with exponential backoff
  const attemptRetry = useCallback(async (
    retryFunction: () => Promise<any>,
    context?: string
  ) => {
    const currentRetryCount = errorState.retryCount + 1;
    
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: currentRetryCount
    }));

    // Calculate delay with exponential backoff
    const delay = exponentialBackoff 
      ? retryDelay * Math.pow(2, currentRetryCount - 1)
      : retryDelay;

    if (showToasts) {
      toast({
        title: `Mencoba Lagi (${currentRetryCount}/${maxRetries})`,
        description: `Menunggu ${Math.round(delay / 1000)} detik...`,
        duration: delay,
      });
    }

    retryTimeoutRef.current = setTimeout(async () => {
      try {
        await retryFunction();
        
        // Success - reset error state
        setErrorState({
          hasError: false,
          error: null,
          isRetrying: false,
          retryCount: 0,
          isOffline: false,
          lastErrorTime: 0
        });

        if (showToasts) {
          toast({
            title: "Berhasil",
            description: "Data berhasil dimuat.",
            duration: 2000,
          });
        }
      } catch (retryError) {
        setErrorState(prev => ({ ...prev, isRetrying: false }));
        
        if (currentRetryCount < maxRetries) {
          await handleError(retryError, retryFunction, context);
        } else {
          if (showToasts) {
            toast({
              title: "Gagal Setelah Beberapa Percobaan",
              description: "Silakan periksa koneksi dan coba lagi nanti.",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      }
    }, delay);
  }, [errorState.retryCount, retryDelay, exponentialBackoff, maxRetries, showToasts, handleError]);

  // Manual retry function
  const manualRetry = useCallback(async (retryFunction: () => Promise<any>) => {
    setErrorState(prev => ({ ...prev, retryCount: 0 }));
    await attemptRetry(retryFunction);
  }, [attemptRetry]);

  // Reset error state
  const resetError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
      isOffline: false,
      lastErrorTime: 0
    });
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  // Check if should show error UI
  const shouldShowError = errorState.hasError && !errorState.isRetrying;
  const canRetry = errorState.retryCount < maxRetries;

  return {
    // Error state
    ...errorState,
    shouldShowError,
    canRetry,
    
    // Functions
    handleError,
    manualRetry,
    resetError,
    
    // Utilities
    isConnected: typeof window !== 'undefined' ? navigator.onLine && !errorState.isOffline : true,
    queueSize: offlineQueueRef.current.length
  };
}

// Hook for API calls with built-in error handling
export function useMobileApiCall<T = any>(
  apiFunction: () => Promise<T>,
  options: MobileErrorHandlerOptions & {
    immediate?: boolean;
    dependencies?: any[];
  } = {}
) {
  const { immediate = true, dependencies = [], ...errorOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  
  const errorHandler = useMobileErrorHandler(errorOptions);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFunction();
      setData(result);
      errorHandler.resetError();
      return result;
    } catch (error) {
      await errorHandler.handleError(error, execute, 'API Call');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, errorHandler]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, ...dependencies]);

  return {
    data,
    loading: loading || errorHandler.isRetrying,
    error: errorHandler.error,
    execute,
    retry: () => errorHandler.manualRetry(execute),
    ...errorHandler
  };
}