'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Settings,
  Bell,
  Monitor,
  Camera,
  Database,
  Shield,
  Clock
} from 'lucide-react';

// Generic Loading Fallback
export function LoadingFallback({ 
  title = "Loading...", 
  description = "Please wait while we load your data",
  showSkeleton = true 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <CardTitle>{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      {showSkeleton && (
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Network Error Fallback
export function NetworkErrorFallback({ 
  onRetry, 
  componentName = "Component",
  showOfflineMode = true 
}) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <WifiOff className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Connection Error</CardTitle>
        </div>
        <p className="text-sm text-orange-800">
          Unable to load {componentName}. Please check your internet connection.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          {showOfflineMode && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Offline Mode Active
            </Badge>
          )}
        </div>
        
        {showOfflineMode && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Offline Mode:</strong> Some features may be limited. 
              Changes will sync when connection is restored.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// DSLR Monitor Fallback
export function DSLRMonitorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">DSLR Monitor Unavailable</CardTitle>
          </div>
          <p className="text-sm text-red-800">
            Unable to connect to DSLR monitoring service.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 border border-red-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-red-900">Service Status</p>
              <p className="text-xs text-red-700">Unknown</p>
            </div>
            <div className="text-center p-4 border border-red-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
                <WifiOff className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-red-900">Connection</p>
              <p className="text-xs text-red-700">Disconnected</p>
            </div>
            <div className="text-center p-4 border border-red-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-red-900">Status</p>
              <p className="text-xs text-red-700">Error</p>
            </div>
          </div>
          
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Notification Manager Fallback
export function NotificationManagerFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Notification Manager Unavailable</CardTitle>
          </div>
          <p className="text-sm text-yellow-800">
            Unable to load notification settings. Using default configuration.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border border-yellow-200 rounded-lg text-center">
              <Bell className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">Upload Success</span>
              <div className="text-xs text-yellow-700">Default: ON</div>
            </div>
            <div className="p-3 border border-yellow-200 rounded-lg text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">Upload Failed</span>
              <div className="text-xs text-yellow-700">Default: ON</div>
            </div>
            <div className="p-3 border border-yellow-200 rounded-lg text-center">
              <Camera className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">Camera Alert</span>
              <div className="text-xs text-yellow-700">Default: ON</div>
            </div>
            <div className="p-3 border border-yellow-200 rounded-lg text-center">
              <Settings className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">Sound</span>
              <div className="text-xs text-yellow-700">Default: ON</div>
            </div>
          </div>
          
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Notification Settings
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// System Monitor Fallback
export function SystemMonitorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">System Monitor Unavailable</CardTitle>
          </div>
          <p className="text-sm text-blue-800">
            Unable to load system metrics. Showing last known status.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 border border-blue-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Database className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-blue-900">Database</p>
              <p className="text-xs text-blue-700">Status Unknown</p>
            </div>
            <div className="text-center p-4 border border-blue-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Monitor className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-blue-900">Server</p>
              <p className="text-xs text-blue-700">Status Unknown</p>
            </div>
            <div className="text-center p-4 border border-blue-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-blue-900">Security</p>
              <p className="text-xs text-blue-700">Status Unknown</p>
            </div>
            <div className="text-center p-4 border border-blue-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Wifi className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-blue-900">Network</p>
              <p className="text-xs text-blue-700">Status Unknown</p>
            </div>
          </div>
          
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh System Status
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Generic Data Error Fallback
export function DataErrorFallback({ 
  title = "Data Error",
  message = "Unable to load data",
  onRetry,
  showDetails = false,
  error
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  error?: Error;
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">{title}</CardTitle>
        </div>
        <p className="text-sm text-red-800">{message}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {showDetails && error && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-red-700">
              Error Details
            </summary>
            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded text-xs font-mono text-red-800">
              {error.message}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Offline Mode Banner
export function OfflineModeBanner({ 
  isOnline = true,
  onRetryConnection 
}: {
  isOnline?: boolean;
  onRetryConnection?: () => void;
}) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline</span>
          <span className="text-xs opacity-90">Changes will sync when connection is restored</span>
        </div>
        {onRetryConnection && (
          <Button 
            onClick={onRetryConnection}
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-orange-600"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}