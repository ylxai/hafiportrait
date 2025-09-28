'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  useRealtimeProvider, 
  realtimeUtils 
} from '@/lib/realtime-provider';
import { 
  Wifi, 
  WifiOff,
  Zap,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  Gauge
} from 'lucide-react';

export default function RealtimeProviderSwitcher() {
  const { 
    provider, 
    isSocketIO, 
    isWebSocket,
    features 
  } = useRealtimeProvider();

  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setProviderInfo(realtimeUtils.getProviderInfo());
  }, []);

  const handleSwitchToSocketIO = async () => {
    setIsLoading(true);
    try {
      realtimeUtils.enableSocketIO();
    } catch (error) {
      console.error('Failed to switch to Socket.IO:', error);
      setIsLoading(false);
    }
  };

  const handleSwitchToWebSocket = async () => {
    setIsLoading(true);
    try {
      realtimeUtils.enableWebSocket();
    } catch (error) {
      console.error('Failed to switch to WebSocket:', error);
      setIsLoading(false);
    }
  };

  const handleClearOverride = async () => {
    setIsLoading(true);
    try {
      realtimeUtils.clearOverride();
    } catch (error) {
      console.error('Failed to clear override:', error);
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Real-time Provider
        </CardTitle>
        <CardDescription>
          Switch between WebSocket and Socket.IO implementations for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Current Provider</h4>
            <Badge variant={isSocketIO ? "default" : "secondary"} className="text-xs">
              {provider.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Active:</span>
              <div className="text-gray-900">{provider}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Environment:</span>
              <div className="text-gray-900">{providerInfo?.environment || 'unknown'}</div>
            </div>
            {providerInfo?.override && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Override:</span>
                <div className="text-orange-600">{providerInfo.override} (localStorage)</div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Comparison */}
        <div>
          <h4 className="font-medium mb-3">Feature Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WebSocket Features */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4" />
                <span className="font-medium">WebSocket</span>
                {isWebSocket && <Badge variant="default" className="text-xs">Active</Badge>}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-time updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Low latency</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>No auto-fallback</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Basic mobile support</span>
                </div>
              </div>
            </div>

            {/* Socket.IO Features */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Socket.IO</span>
                {isSocketIO && <Badge variant="default" className="text-xs">Active</Badge>}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-time updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Auto-fallback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Mobile optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Room management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Compression</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Rate limiting</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Features */}
        <div>
          <h4 className="font-medium mb-3">Current Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 border rounded text-sm">
              <div className={`w-2 h-2 rounded-full ${features.rooms ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Room Management</span>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded text-sm">
              <div className={`w-2 h-2 rounded-full ${features.compression ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Compression</span>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded text-sm">
              <div className={`w-2 h-2 rounded-full ${features.autoFallback ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Auto-fallback</span>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded text-sm">
              <div className={`w-2 h-2 rounded-full ${features.uploadProgress ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Upload Progress</span>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded text-sm">
              <div className={`w-2 h-2 rounded-full ${features.mobileOptimized ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded text-sm">
              <div className={`w-2 h-2 rounded-full ${features.rateLimiting ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Rate Limiting</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Provider Controls */}
        <div>
          <h4 className="font-medium mb-3">Provider Controls</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={isSocketIO ? "default" : "outline"}
              onClick={handleSwitchToSocketIO}
              disabled={isLoading || isSocketIO}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Socket.IO
              {isSocketIO && <CheckCircle className="h-3 w-3" />}
            </Button>
            
            <Button
              variant={isWebSocket ? "default" : "outline"}
              onClick={handleSwitchToWebSocket}
              disabled={isLoading || isWebSocket}
              className="flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              WebSocket
              {isWebSocket && <CheckCircle className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleClearOverride}
              disabled={isLoading || !providerInfo?.override}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Override
            </Button>
          </div>
        </div>

        {/* Testing Information */}
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Testing Instructions:</p>
              <ul className="space-y-1 text-xs">
                <li>• Switch providers to compare performance</li>
                <li>• Test mobile devices with Socket.IO for auto-fallback</li>
                <li>• Monitor connection stability in Network tab</li>
                <li>• Check real-time updates in DSLR Monitor</li>
                <li>• Override persists until cleared or page refresh</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div>
          <h4 className="font-medium mb-3">Performance Indicators</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto mb-1">
                <Gauge className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium">Latency</p>
              <p className="text-xs text-muted-foreground">
                {isSocketIO ? '10-20ms' : '5-10ms'}
              </p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mx-auto mb-1">
                <Globe className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium">Compatibility</p>
              <p className="text-xs text-muted-foreground">
                {isSocketIO ? '99%+' : '95%+'}
              </p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 mx-auto mb-1">
                <Smartphone className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium">Mobile</p>
              <p className="text-xs text-muted-foreground">
                {isSocketIO ? 'Excellent' : 'Good'}
              </p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 mx-auto mb-1">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium">Reliability</p>
              <p className="text-xs text-muted-foreground">
                {isSocketIO ? 'High' : 'Medium'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Changes require page reload
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}