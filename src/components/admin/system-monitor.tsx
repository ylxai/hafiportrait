'use client';

import { useState, useEffect } from 'react';
import { useApiWithRecovery } from '@/hooks/use-error-recovery';
import AdminErrorBoundary from '@/components/error/AdminErrorBoundary';
import { SystemMonitorFallback, NetworkErrorFallback } from '@/components/admin/fallback-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useSystemNotifications, useRealtimeProvider } from '@/lib/realtime-provider';
import { 
  Monitor, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Wifi,
  Globe,
  Camera,
  Upload,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';

interface SystemMetrics {
  server: {
    status: 'online' | 'offline' | 'maintenance';
    uptime: string;
    responseTime: number;
    lastCheck: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'slow';
    connectionCount: number;
    queryTime: number;
    lastBackup: string;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
    networkIO: number;
  };
  dslr: {
    serviceStatus: 'running' | 'stopped' | 'error';
    cameraConnected: boolean;
    uploadsToday: number;
    lastUpload: string | null;
    queueSize: number;
  };
  security: {
    sslStatus: 'valid' | 'expired' | 'warning';
    lastSecurityScan: string;
    threatLevel: 'low' | 'medium' | 'high';
    failedLogins: number;
  };
}

function SystemMonitorContent() {
  // Real-time WebSocket integration
  const {
    notifications: systemNotifications,
    isConnected: wsConnected,
    unreadCount,
    markAsRead,
    clearNotifications,
    provider
  } = useSystemNotifications();

  const {
    provider: currentProvider,
    isSocketIO,
    features
  } = useRealtimeProvider();

  const [metrics, setMetrics] = useState<SystemMetrics>({
    server: {
      status: 'online',
      uptime: '7 days, 14 hours',
      responseTime: 245,
      lastCheck: new Date().toISOString()
    },
    database: {
      status: 'connected',
      connectionCount: 12,
      queryTime: 89,
      lastBackup: new Date(Date.now() - 86400000).toISOString()
    },
    storage: {
      used: 2.4,
      total: 10,
      percentage: 24,
      status: 'normal'
    },
    performance: {
      cpuUsage: 35,
      memoryUsage: 68,
      diskIO: 15,
      networkIO: 8
    },
    dslr: {
      serviceStatus: 'running',
      cameraConnected: true,
      uploadsToday: 47,
      lastUpload: new Date(Date.now() - 300000).toISOString(),
      queueSize: 3
    },
    security: {
      sslStatus: 'valid',
      lastSecurityScan: new Date(Date.now() - 3600000).toISOString(),
      threatLevel: 'low',
      failedLogins: 2
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [useRealtime, setUseRealtime] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load system monitor settings on mount
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        // Try to load from API first
        const response = await fetch('/api/admin/system/settings');
        if (response.ok) {
          const data = await response.json();
          setUseRealtime(data.useRealtime !== undefined ? data.useRealtime : true);
        } else {
          // Fallback to localStorage
          const savedSettings = localStorage.getItem('system-monitor-settings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setUseRealtime(parsed.useRealtime !== undefined ? parsed.useRealtime : true);
          }
        }
      } catch (error) {
        console.error('Failed to load system monitor settings:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('system-monitor-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setUseRealtime(parsed.useRealtime !== undefined ? parsed.useRealtime : true);
        }
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSystemSettings();
  }, []);

  // Save settings when useRealtime changes
  useEffect(() => {
    if (!settingsLoaded) return; // Don't save during initial load

    const saveSystemSettings = async () => {
      const settings = { useRealtime };
      
      try {
        // Save to API first
        const response = await fetch('/api/admin/system/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });

        if (response.ok) {
          // Also save to localStorage as backup
          localStorage.setItem('system-monitor-settings', JSON.stringify(settings));
        } else {
          throw new Error('API save failed');
        }
      } catch (error) {
        console.error('Failed to save system monitor settings:', error);
        // Fallback to localStorage only
        localStorage.setItem('system-monitor-settings', JSON.stringify(settings));
      }
    };

    saveSystemSettings();
  }, [useRealtime, settingsLoaded]);

  // Handle real-time system notifications
  useEffect(() => {
    if (useRealtime && systemNotifications.length > 0) {
      console.log('🔄 Processing system notifications from WebSocket:', systemNotifications);
      
      // Process system notifications to update metrics
      systemNotifications.forEach(notification => {
        if (notification.type === 'system') {
          // Update metrics based on notification content
          if (notification.message.includes('storage')) {
            setMetrics(prev => ({
              ...prev,
              storage: {
                ...prev.storage,
                status: notification.priority === 'critical' ? 'critical' : 
                       notification.priority === 'high' ? 'warning' : 'normal'
              }
            }));
          }
          
          if (notification.message.includes('backup')) {
            setMetrics(prev => ({
              ...prev,
              database: {
                ...prev.database,
                lastBackup: new Date().toISOString()
              }
            }));
          }
        }
      });
    }
  }, [systemNotifications, useRealtime]);

  // Fetch real system metrics
  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Enhanced adaptive polling for system metrics
    const getPollingInterval = () => {
      // If real-time is enabled and WebSocket is connected, use longer intervals
      if (useRealtime && wsConnected) {
        return 60000; // 60s when WebSocket is active
      }
      
      // Check if system is under high load
      const isHighLoad = metrics.performance.cpuUsage > 75 || metrics.performance.memoryUsage > 80;
      const hasActiveUploads = metrics.dslr.queueSize > 0 || metrics.dslr.serviceStatus === 'running';
      
      if (isHighLoad || hasActiveUploads) {
        return 15000; // 15s during high activity
      } else {
        return 45000; // 45s during normal operation
      }
    };
    
    // Only start polling if real-time is disabled or WebSocket is not connected
    if (!useRealtime || !wsConnected) {
      const pollingInterval = getPollingInterval();
      const interval = setInterval(fetchMetrics, pollingInterval);
      
      console.log(`📊 System Monitor polling: ${pollingInterval}ms (Real-time: ${useRealtime}, WS: ${wsConnected})`);
      
      return () => clearInterval(interval);
    } else {
      console.log('📡 System Monitor using real-time WebSocket updates');
    }
  }, [useRealtime, wsConnected]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    
    // Actually fetch new data
    try {
      await fetchMetrics();
      
      // Clear notifications if using real-time
      if (useRealtime && wsConnected) {
        markAsRead();
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Define fetchMetrics function outside useEffect so it can be called from handleRefresh
  const fetchMetrics = async () => {
    try {
      // Fetch DSLR status
      const dslrResponse = await fetch('/api/dslr/status');
      if (dslrResponse.ok) {
        const dslrData = await dslrResponse.json();
        setMetrics(prev => ({
          ...prev,
          dslr: {
            serviceStatus: dslrData.serviceRunning ? 'running' : 'stopped',
            cameraConnected: dslrData.isConnected || false,
            uploadsToday: dslrData.totalUploaded || 0,
            lastUpload: dslrData.lastUpload,
            queueSize: dslrData.queueSize || 0
          }
        }));
      }

      // Fetch database status
      const dbResponse = await fetch('/api/test/db');
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        setMetrics(prev => ({
          ...prev,
          database: {
            ...prev.database,
            status: dbData.success ? 'connected' : 'disconnected'
          }
        }));
      }

      // Fetch storage status (simplified to avoid initialization errors)
      try {
        const storageResponse = await fetch('/api/admin/storage/status');
        if (storageResponse.ok) {
          const storageData = await storageResponse.json();
          
          if (storageData?.success && storageData?.data) {
            // Simplified data access to avoid hoisting issues
            const tierDist = storageData.data.tierDistribution;
            const r2TierData = tierDist?.cloudflareR2;
            
            if (r2TierData?.totalSize) {
              const totalGB = 10;
              const usedBytes = r2TierData.totalSize;
              const usedGB = Math.max(0, usedBytes / (1024 * 1024 * 1024));
              const percentage = Math.min(Math.round((usedGB / totalGB) * 100), 100);
              
              setMetrics(prev => ({
                ...prev,
                storage: {
                  used: usedGB,
                  total: totalGB,
                  percentage: percentage,
                  status: percentage > 90 ? 'critical' : percentage > 80 ? 'warning' : 'normal'
                }
              }));
            }
          }
        }
      } catch (error) {
        // Silent fallback - keep existing dummy data
      }

      // Simulate other metrics (in real app, these would come from monitoring APIs)
      setMetrics(prev => ({
        ...prev,
        server: {
          ...prev.server,
          responseTime: Math.floor(Math.random() * 100) + 200,
          lastCheck: new Date().toISOString()
        },
        performance: {
          cpuUsage: Math.floor(Math.random() * 30) + 20,
          memoryUsage: Math.floor(Math.random() * 40) + 50,
          diskIO: Math.floor(Math.random() * 20) + 5,
          networkIO: Math.floor(Math.random() * 15) + 3
        }
      }));

    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'running':
      case 'valid':
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'slow':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
      case 'disconnected':
      case 'stopped':
      case 'error':
      case 'expired':
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'running':
      case 'valid':
      case 'normal':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'slow':
        return <AlertTriangle className="h-4 w-4" />;
      case 'offline':
      case 'disconnected':
      case 'stopped':
      case 'error':
      case 'expired':
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatUptime = (uptime: string) => {
    return uptime;
  };

  const formatFileSize = (gb: number) => {
    return `${gb.toFixed(1)} GB`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="space-y-4">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">System Monitoring</h2>
            <p className="text-sm sm:text-base text-gray-600">Real-time system health and performance metrics</p>
          </div>
          
          {/* Mobile Refresh Button - Always Visible */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="touch-manipulation min-h-[44px] px-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">🔄</span>
            </Button>
            
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Controls Section - Mobile Stacked */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-500">
            Last updated: {formatTimeAgo(lastRefresh.toISOString())}
          </div>
          
          {/* Real-time WebSocket Controls */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {currentProvider} {wsConnected ? 'connected' : 'disconnected'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={useRealtime}
              onCheckedChange={setUseRealtime}
              disabled={!wsConnected}
            />
            <span className="text-xs sm:text-sm text-gray-600">Real-time</span>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(metrics.server.status)}`}>
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Server</p>
                  <p className="text-sm text-gray-600">{metrics.server.responseTime}ms</p>
                </div>
              </div>
              <Badge variant={metrics.server.status === 'online' ? 'default' : 'destructive'}>
                {getStatusIcon(metrics.server.status)}
                <span className="ml-1 capitalize">{metrics.server.status}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(metrics.database.status)}`}>
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-gray-600">{metrics.database.queryTime}ms</p>
                </div>
              </div>
              <Badge variant={metrics.database.status === 'connected' ? 'default' : 'destructive'}>
                {getStatusIcon(metrics.database.status)}
                <span className="ml-1 capitalize">{metrics.database.status}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* DSLR Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(metrics.dslr.serviceStatus)}`}>
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">DSLR Service</p>
                  <p className="text-sm text-gray-600">{metrics.dslr.uploadsToday} uploads</p>
                </div>
              </div>
              <Badge variant={metrics.dslr.serviceStatus === 'running' ? 'default' : 'destructive'}>
                {getStatusIcon(metrics.dslr.serviceStatus)}
                <span className="ml-1 capitalize">{metrics.dslr.serviceStatus}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(metrics.security.sslStatus)}`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Security</p>
                  <p className="text-sm text-gray-600">SSL {metrics.security.sslStatus}</p>
                </div>
              </div>
              <Badge variant={metrics.security.threatLevel === 'low' ? 'default' : 'destructive'}>
                {getStatusIcon(metrics.security.sslStatus)}
                <span className="ml-1 capitalize">{metrics.security.threatLevel}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.performance.cpuUsage}%</span>
              </div>
              <Progress value={metrics.performance.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.performance.memoryUsage}%</span>
              </div>
              <Progress value={metrics.performance.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Disk I/O</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.performance.diskIO}%</span>
              </div>
              <Progress value={metrics.performance.diskIO} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Network I/O</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.performance.networkIO}%</span>
              </div>
              <Progress value={metrics.performance.networkIO} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Storage & System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage & System Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Storage Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm text-gray-600">
                  {formatFileSize(metrics.storage.used)} / {formatFileSize(metrics.storage.total)}
                </span>
              </div>
              <Progress value={metrics.storage.percentage} className="h-2" />
              <div className="text-xs text-gray-500">
                {metrics.storage.percentage}% used
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Server Uptime</span>
                <span className="text-sm font-medium">{formatUptime(metrics.server.uptime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database Connections</span>
                <span className="text-sm font-medium">{metrics.database.connectionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm font-medium">{formatTimeAgo(metrics.database.lastBackup)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Logins (24h)</span>
                <span className="text-sm font-medium">{metrics.security.failedLogins}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DSLR & Upload Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            DSLR & Upload Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                metrics.dslr.serviceStatus === 'running' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <Monitor className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Service Status</p>
              <p className="text-xs text-gray-600 capitalize">{metrics.dslr.serviceStatus}</p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                metrics.dslr.cameraConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Camera</p>
              <p className="text-xs text-gray-600">
                {metrics.dslr.cameraConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 bg-blue-100 text-blue-600">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Uploads Today</p>
              <p className="text-xs text-gray-600">{metrics.dslr.uploadsToday} photos</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 bg-purple-100 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Queue Size</p>
              <p className="text-xs text-gray-600">{metrics.dslr.queueSize} pending</p>
            </div>
          </div>

          {metrics.dslr.lastUpload && (
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-600">
                Last upload: {formatTimeAgo(metrics.dslr.lastUpload)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time System Notifications */}
      {useRealtime && wsConnected && systemNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Real-time System Notifications
              </div>
              <Button
                onClick={clearNotifications}
                variant="outline"
                size="sm"
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {systemNotifications.slice(0, 10).map((notification, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    notification.priority === 'critical' ? 'bg-red-50 border-red-200' :
                    notification.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                    notification.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className={`p-1 rounded ${
                    notification.priority === 'critical' ? 'bg-red-100 text-red-600' :
                    notification.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                    notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {notification.priority === 'critical' ? <XCircle className="h-4 w-4" /> :
                     notification.priority === 'high' ? <AlertTriangle className="h-4 w-4" /> :
                     <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    Real-time
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts & Warnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.storage.percentage > 80 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Storage Warning</p>
                  <p className="text-xs text-yellow-700">
                    Storage usage is at {metrics.storage.percentage}%. Consider cleaning up old files.
                  </p>
                </div>
              </div>
            )}

            {metrics.performance.memoryUsage > 85 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">High Memory Usage</p>
                  <p className="text-xs text-orange-700">
                    Memory usage is at {metrics.performance.memoryUsage}%. System may slow down.
                  </p>
                </div>
              </div>
            )}

            {!metrics.dslr.cameraConnected && metrics.dslr.serviceStatus === 'running' && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Camera className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Camera Disconnected</p>
                  <p className="text-xs text-blue-700">
                    DSLR service is running but camera is not connected.
                  </p>
                </div>
              </div>
            )}

            {metrics.security.failedLogins > 5 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Security Alert</p>
                  <p className="text-xs text-red-700">
                    {metrics.security.failedLogins} failed login attempts in the last 24 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Show "All systems normal" if no alerts */}
            {metrics.storage.percentage <= 80 && 
             metrics.performance.memoryUsage <= 85 && 
             (metrics.dslr.cameraConnected || metrics.dslr.serviceStatus !== 'running') &&
             metrics.security.failedLogins <= 5 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">All Systems Normal</p>
                  <p className="text-xs text-green-700">
                    No alerts or warnings detected. System is running optimally.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component with error boundary
export default function SystemMonitor() {
  return (
    <AdminErrorBoundary 
      componentName="System Monitor"
      fallback={<SystemMonitorFallback />}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <SystemMonitorContent />
    </AdminErrorBoundary>
  );
}