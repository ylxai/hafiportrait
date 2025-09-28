'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, Wifi, WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface MobileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
  retryCount: number;
}

interface MobileErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<MobileErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
}

interface MobileErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retry: () => void;
  canRetry: boolean;
  isRetrying: boolean;
  retryCount: number;
  isOffline: boolean;
}

// Default mobile error fallback component
function DefaultMobileErrorFallback({
  error,
  retry,
  canRetry,
  isRetrying,
  retryCount,
  isOffline
}: MobileErrorFallbackProps) {
  const getErrorIcon = () => {
    if (isOffline) return <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />;
    return <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />;
  };

  const getErrorTitle = () => {
    if (isOffline) return "Tidak Ada Koneksi";
    if (error?.message.includes('fetch') || error?.message.includes('network')) {
      return "Masalah Koneksi";
    }
    return "Terjadi Kesalahan";
  };

  const getErrorDescription = () => {
    if (isOffline) {
      return "Periksa koneksi internet Anda dan coba lagi.";
    }
    if (error?.message.includes('fetch')) {
      return "Tidak dapat memuat data. Periksa koneksi Anda.";
    }
    return "Terjadi kesalahan tidak terduga. Silakan coba lagi.";
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          {getErrorIcon()}
          <CardTitle className="text-xl font-semibold text-gray-900">
            {getErrorTitle()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center text-sm leading-relaxed">
            {getErrorDescription()}
          </p>

          {/* Retry Count Display */}
          {retryCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-xs text-center">
                Percobaan ke-{retryCount}
              </p>
            </div>
          )}

          {/* Network Status */}
          <div className="flex items-center justify-center gap-2 py-2">
            {navigator.onLine ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">Terhubung</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600">Tidak terhubung</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {canRetry && (
              <Button
                onClick={retry}
                disabled={isRetrying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Mencoba Lagi...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex-1 h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 h-11"
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Button>
            </div>
          </div>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Detail Error (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export class MobileErrorBoundary extends Component<
  MobileErrorBoundaryProps,
  MobileErrorBoundaryState
> {
  private retryTimeoutRef: NodeJS.Timeout | null = null;

  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MobileErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('MobileErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: this.state.retryCount + 1,
    });

    // Simulate retry delay
    this.retryTimeoutRef = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
    }, 1000);
  };

  componentWillUnmount() {
    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }
  }

  render() {
    const { 
      children, 
      fallbackComponent: FallbackComponent = DefaultMobileErrorFallback,
      enableRetry = true,
      maxRetries = 3 
    } = this.props;

    if (this.state.hasError) {
      const canRetry = enableRetry && this.state.retryCount < maxRetries;
      const isOffline = !navigator.onLine;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.handleRetry}
          canRetry={canRetry}
          isRetrying={this.state.isRetrying}
          retryCount={this.state.retryCount}
          isOffline={isOffline}
        />
      );
    }

    return children;
  }
}

// Hook-based error boundary for functional components
export function withMobileErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<MobileErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <MobileErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </MobileErrorBoundary>
    );
  };
}

export { DefaultMobileErrorFallback };
export type { MobileErrorBoundaryProps, MobileErrorFallbackProps };