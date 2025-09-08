'use client';

import { useState, useEffect } from 'react';
import { AdminErrorBoundary } from '@/components/error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useDSLRRealtime, useRealtimeProvider } from '@/lib/realtime-provider';
import { 
  Camera, 
  Upload, 
  Pause, 
  Play, 
  Settings, 
  Wifi, 
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  FolderOpen,
  Image,
  Save,
  RotateCcw,
  Zap,
  WifiIcon
} from 'lucide-react';

interface DSLRStats {
  isConnected: boolean;
  isProcessing: boolean;
  totalUploaded: number;
  failedUploads: number;
  lastUpload: string | null;
  watchFolder: string;
  eventId: string;
  uploaderName: string;
  queueSize: number;
  uploadSpeed: number; // MB/s
  serviceRunning: boolean;
  lastHeartbeat: string | null;
  cameraModel: string;
  autoDetect: boolean;
  backupEnabled: boolean;
  notificationsEnabled: boolean;
  watermarkEnabled: boolean;
}

interface Event {
  id: string;
  name: string;
  date: string;
  status?: string;
}

interface RecentUpload {
  id: string;
  fileName: string;
  uploadTime: string;
  fileSize: number;
  status: 'success' | 'failed' | 'uploading';
  photoUrl?: string;
}

interface DSLRSettings {
  autoUpload: boolean;
  watchFolder: string;
  cameraModel: string;
  autoDetect: boolean;
  backupEnabled: boolean;
  notificationsEnabled: boolean;
  watermarkEnabled: boolean;
  connectionCheck: number;
}

function DSLRMonitorContent() {
  // Real-time data with automatic provider selection
  const { 
    isConnected: wsConnected, 
    dslrStatus: realtimeDslrStatus, 
    cameraStatus, 
    uploadProgress,
    refreshStatus,
    provider,
    transport,
    connectionMode
  } = useDSLRRealtime();

  // Provider information
  const { 
    provider: currentProvider, 
    isSocketIO, 
    isWebSocket,
    features 
  } = useRealtimeProvider();

  const [stats, setStats] = useState<DSLRStats>({
    isConnected: false,
    isProcessing: false,
    totalUploaded: 0,
    failedUploads: 0,
    lastUpload: null,
    watchFolder: process.platform === 'win32' ? 'C:/DCIM/100NIKON' : '/media/DCIM/100NIKON',
    eventId: '',
    uploaderName: 'Official Photographer',
    queueSize: 0,
    uploadSpeed: 0,
    serviceRunning: false,
    lastHeartbeat: null,
    cameraModel: 'Auto-detect',
    autoDetect: true,
    backupEnabled: true,
    notificationsEnabled: true,
    watermarkEnabled: false
  });

  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [settings, setSettings] = useState({
    autoUpload: true,
    eventId: '',
    uploaderName: 'Official Photographer',
    watchFolder: 'C:/DCIM/100NIKON'
  });

  const [dslrSettings, setDslrSettings] = useState<DSLRSettings>({
    autoUpload: true,
    watchFolder: 'C:/DCIM/100NIKON',
    cameraModel: 'NIKON_D7100',
    autoDetect: true,
    backupEnabled: true,
    notificationsEnabled: true,
    watermarkEnabled: false,
    connectionCheck: 30000
  });

  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useRealtime, setUseRealtime] = useState(true);

  // DSLR Settings handlers
  const handleDslrSettingsChange = async (key: keyof DSLRSettings, value: any) => {
    setDslrSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedSettings(true);

    // Special handling for autoUpload - immediately sync with service control
    if (key === 'autoUpload') {
      try {
        const action = value ? 'start' : 'stop';
        const response = await fetch('/api/dslr/control', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action })
        });

        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({ 
            ...prev, 
            serviceRunning: data.state.isRunning,
            isProcessing: data.state.isRunning ? prev.isProcessing : false
          }));
          
          // Update settings state to match
          setSettings(prev => ({ ...prev, autoUpload: data.state.isRunning }));
          
          // Show notification
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('admin-notification', {
              detail: {
                type: 'success',
                message: `DSLR service ${action}ed successfully`
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error toggling DSLR service:', error);
        // Revert the change if API call failed
        setDslrSettings(prev => ({ ...prev, autoUpload: !value }));
      }
    }
  };

  const handleSaveDslrSettings = async () => {
    try {
      // Save to API first
      const response = await fetch('/api/dslr/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_settings',
          settings: {
            watchFolder: dslrSettings.watchFolder,
            cameraModel: dslrSettings.cameraModel,
            autoDetect: dslrSettings.autoDetect,
            backupEnabled: dslrSettings.backupEnabled,
            notificationsEnabled: dslrSettings.notificationsEnabled,
            watermarkEnabled: dslrSettings.watermarkEnabled
          }
        })
      });

      if (response.ok) {
        // Also save to localStorage as backup
        localStorage.setItem('dslr-settings', JSON.stringify(dslrSettings));
        setHasUnsavedSettings(false);
        
        // Update stats to reflect saved settings
        setStats(prev => ({
          ...prev,
          watchFolder: dslrSettings.watchFolder,
          cameraModel: dslrSettings.cameraModel,
          autoDetect: dslrSettings.autoDetect,
          backupEnabled: dslrSettings.backupEnabled,
          notificationsEnabled: dslrSettings.notificationsEnabled,
          watermarkEnabled: dslrSettings.watermarkEnabled
        }));
        
        // Show success notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin-notification', {
            detail: {
              type: 'success',
              message: 'DSLR configuration saved successfully'
            }
          }));
        }
        
        console.log('✅ DSLR settings saved successfully');
      } else {
        throw new Error('Failed to save to API');
      }
    } catch (error) {
      console.error('Failed to save DSLR settings:', error);
      
      // Still save to localStorage as fallback
      localStorage.setItem('dslr-settings', JSON.stringify(dslrSettings));
      setHasUnsavedSettings(false);
      
      // Show warning notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-notification', {
          detail: {
            type: 'warning',
            message: 'Settings saved locally only (API unavailable)'
          }
        }));
      }
    }
  };

  const handleResetDslrSettings = () => {
    if (confirm('Reset all DSLR settings to default?')) {
      const defaultSettings: DSLRSettings = {
        autoUpload: true,
        watchFolder: 'C:/DCIM/100NIKON',
        cameraModel: 'NIKON_D7100',
        autoDetect: true,
        backupEnabled: true,
        notificationsEnabled: true,
        watermarkEnabled: false,
        connectionCheck: 30000
      };
      setDslrSettings(defaultSettings);
      setHasUnsavedSettings(false);
    }
  };

  // Load saved DSLR settings from API and localStorage on component mount
  useEffect(() => {
    const loadDslrSettings = async () => {
      try {
        // First try to get from API
        const response = await fetch('/api/dslr/status');
        if (response.ok) {
          const data = await response.json();
          
          // Update dslrSettings from API data
          setDslrSettings(prev => ({
            ...prev,
            autoUpload: data.serviceRunning || false,
            watchFolder: data.watchFolder || prev.watchFolder,
            cameraModel: data.cameraModel || prev.cameraModel,
            autoDetect: data.autoDetect !== undefined ? data.autoDetect : prev.autoDetect,
            backupEnabled: data.backupEnabled !== undefined ? data.backupEnabled : prev.backupEnabled,
            notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : prev.notificationsEnabled,
            watermarkEnabled: data.watermarkEnabled !== undefined ? data.watermarkEnabled : prev.watermarkEnabled
          }));
          
          // Also update settings state
          setSettings(prev => ({
            ...prev,
            autoUpload: data.serviceRunning || false,
            eventId: data.eventId || prev.eventId,
            uploaderName: data.uploaderName || prev.uploaderName,
            watchFolder: data.watchFolder || prev.watchFolder
          }));
        }
        
        // Fallback to localStorage if API fails
        const savedSettings = localStorage.getItem('dslr-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setDslrSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error('Failed to load DSLR settings:', error);
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('dslr-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setDslrSettings(prev => ({ ...prev, ...parsed }));
        }
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/admin/events');
        if (response.ok) {
          const events = await response.json();
          setAvailableEvents(events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    loadDslrSettings();
    fetchEvents();
  }, []);

  // Update stats from WebSocket real-time data
  useEffect(() => {
    if (useRealtime && realtimeDslrStatus) {
      console.log('🔄 Updating DSLR stats from WebSocket:', realtimeDslrStatus);
      setStats(prev => ({
        ...prev,
        isConnected: realtimeDslrStatus.isConnected || false,
        isProcessing: realtimeDslrStatus.isProcessing || false,
        totalUploaded: realtimeDslrStatus.totalUploaded || prev.totalUploaded,
        failedUploads: realtimeDslrStatus.failedUploads || prev.failedUploads,
        lastUpload: realtimeDslrStatus.lastUpload || prev.lastUpload,
        watchFolder: realtimeDslrStatus.watchFolder || prev.watchFolder,
        eventId: realtimeDslrStatus.eventId || prev.eventId,
        uploaderName: realtimeDslrStatus.uploaderName || prev.uploaderName,
        queueSize: realtimeDslrStatus.queueSize || 0,
        uploadSpeed: realtimeDslrStatus.uploadSpeed || 0,
        serviceRunning: realtimeDslrStatus.serviceRunning || false,
        lastHeartbeat: realtimeDslrStatus.lastHeartbeat || prev.lastHeartbeat,
        cameraModel: realtimeDslrStatus.cameraModel || prev.cameraModel,
        autoDetect: realtimeDslrStatus.autoDetect !== undefined ? realtimeDslrStatus.autoDetect : prev.autoDetect,
        backupEnabled: realtimeDslrStatus.backupEnabled !== undefined ? realtimeDslrStatus.backupEnabled : prev.backupEnabled,
        notificationsEnabled: realtimeDslrStatus.notificationsEnabled !== undefined ? realtimeDslrStatus.notificationsEnabled : prev.notificationsEnabled,
        watermarkEnabled: realtimeDslrStatus.watermarkEnabled !== undefined ? realtimeDslrStatus.watermarkEnabled : prev.watermarkEnabled
      }));

      // Update settings with current values
      setSettings(prev => ({
        ...prev,
        autoUpload: realtimeDslrStatus.serviceRunning || false,
        eventId: realtimeDslrStatus.eventId || prev.eventId,
        uploaderName: realtimeDslrStatus.uploaderName || prev.uploaderName,
        watchFolder: realtimeDslrStatus.watchFolder || prev.watchFolder
      }));

      // Sync dslrSettings with real-time data to prevent reset on navigation
      setDslrSettings(prev => ({
        ...prev,
        autoUpload: realtimeDslrStatus.serviceRunning || false,
        watchFolder: realtimeDslrStatus.watchFolder || prev.watchFolder,
        cameraModel: realtimeDslrStatus.cameraModel || prev.cameraModel,
        autoDetect: realtimeDslrStatus.autoDetect !== undefined ? realtimeDslrStatus.autoDetect : prev.autoDetect,
        backupEnabled: realtimeDslrStatus.backupEnabled !== undefined ? realtimeDslrStatus.backupEnabled : prev.backupEnabled,
        notificationsEnabled: realtimeDslrStatus.notificationsEnabled !== undefined ? realtimeDslrStatus.notificationsEnabled : prev.notificationsEnabled,
        watermarkEnabled: realtimeDslrStatus.watermarkEnabled !== undefined ? realtimeDslrStatus.watermarkEnabled : prev.watermarkEnabled
      }));
    }
  }, [realtimeDslrStatus, useRealtime]);

  // Handle upload progress updates from WebSocket
  useEffect(() => {
    if (uploadProgress) {
      console.log('📤 Upload progress update:', uploadProgress);
      
      // Add to recent uploads if completed
      if (uploadProgress.status === 'completed') {
        const newUpload: RecentUpload = {
          id: `upload_${Date.now()}`,
          fileName: uploadProgress.fileName || 'New Photo',
          uploadTime: uploadProgress.timestamp || new Date().toISOString(),
          fileSize: uploadProgress.fileSize || 0,
          status: 'success',
          photoUrl: uploadProgress.photoUrl
        };
        
        setRecentUploads(prev => [newUpload, ...prev.slice(0, 9)]);
      }
    }
  }, [uploadProgress]);

  // Fallback: Fetch DSLR status from API when WebSocket is not available
  useEffect(() => {
    const fetchDSLRStatus = async () => {
      try {
        const response = await fetch('/api/dslr/status');
        if (response.ok) {
          const data = await response.json();
          
          // Only update if not using real-time or WebSocket is disconnected
          if (!useRealtime || !wsConnected) {
            setStats(prev => ({
              ...prev,
              isConnected: data.isConnected || false,
              isProcessing: data.isProcessing || false,
              totalUploaded: data.totalUploaded || 0,
              failedUploads: data.failedUploads || 0,
              lastUpload: data.lastUpload || null,
              watchFolder: data.watchFolder || prev.watchFolder,
              eventId: data.eventId || prev.eventId,
              uploaderName: data.uploaderName || prev.uploaderName,
              queueSize: data.queueSize || 0,
              uploadSpeed: data.uploadSpeed || 0,
              serviceRunning: data.serviceRunning || false,
              lastHeartbeat: data.lastHeartbeat || null,
              cameraModel: data.cameraModel || prev.cameraModel,
              autoDetect: data.autoDetect !== undefined ? data.autoDetect : prev.autoDetect,
              backupEnabled: data.backupEnabled !== undefined ? data.backupEnabled : prev.backupEnabled,
              notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : prev.notificationsEnabled,
              watermarkEnabled: data.watermarkEnabled !== undefined ? data.watermarkEnabled : prev.watermarkEnabled
            }));
            
            // Update settings with current values
            setSettings(prev => ({
              ...prev,
              autoUpload: data.serviceRunning || false,
              eventId: data.eventId || prev.eventId,
              uploaderName: data.uploaderName || prev.uploaderName,
              watchFolder: data.watchFolder || prev.watchFolder
            }));

            // Sync dslrSettings with API data to prevent reset on navigation
            setDslrSettings(prev => ({
              ...prev,
              autoUpload: data.serviceRunning || false,
              watchFolder: data.watchFolder || prev.watchFolder,
              cameraModel: data.cameraModel || prev.cameraModel,
              autoDetect: data.autoDetect !== undefined ? data.autoDetect : prev.autoDetect,
              backupEnabled: data.backupEnabled !== undefined ? data.backupEnabled : prev.backupEnabled,
              notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : prev.notificationsEnabled,
              watermarkEnabled: data.watermarkEnabled !== undefined ? data.watermarkEnabled : prev.watermarkEnabled
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch DSLR status:', error);
        // Set disconnected state on error
        setStats(prev => ({
          ...prev,
          isConnected: false,
          isProcessing: false,
          uploadSpeed: 0
        }));
      }
    };

    // Initial fetch
    fetchDSLRStatus();

    // Enhanced adaptive polling based on DSLR activity and connection status
    const getPollingInterval = () => {
      if (useRealtime && wsConnected) {
        // WebSocket connected - minimal polling for fallback
        return stats.isProcessing || stats.queueSize > 0 ? 20000 : 60000; // 20s active, 1min idle
      } else {
        // WebSocket disconnected - aggressive polling for responsiveness
        return stats.isProcessing || stats.queueSize > 0 ? 5000 : 15000; // 5s active, 15s idle
      }
    };
    
    const pollingInterval = getPollingInterval();
    const interval = setInterval(() => {
      if (!useRealtime || !wsConnected) {
        fetchDSLRStatus();
      }
    }, pollingInterval);
    
    console.log(`📊 DSLR Monitor polling: ${pollingInterval}ms (Processing: ${stats.isProcessing}, Queue: ${stats.queueSize})`);

    return () => clearInterval(interval);
  }, [useRealtime, wsConnected]);

  const handlePauseResume = async () => {
    try {
      const action = stats.isProcessing ? 'pause' : 'resume';
      const response = await fetch('/api/dslr/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, isProcessing: data.isProcessing }));
        
        // Show notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin-notification', {
            detail: {
              type: 'success',
              message: `DSLR service ${action}d successfully`
            }
          }));
        }
      } else {
        console.error('Failed to toggle DSLR service');
      }
    } catch (error) {
      console.error('Error toggling DSLR service:', error);
    }
  };

  const handleServiceToggle = async () => {
    try {
      const action = stats.serviceRunning ? 'stop' : 'start';
      const response = await fetch('/api/dslr/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ 
          ...prev, 
          serviceRunning: data.state.isRunning,
          isProcessing: data.state.isRunning ? prev.isProcessing : false
        }));
        
        // Show notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin-notification', {
            detail: {
              type: 'success',
              message: data.message
            }
          }));
        }
      } else {
        console.error('Failed to toggle DSLR service');
      }
    } catch (error) {
      console.error('Error toggling DSLR service:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    if (useRealtime && wsConnected) {
      // Refresh WebSocket data
      refreshStatus();
    } else {
      // Fetch from API
      try {
        const response = await fetch('/api/dslr/status');
        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Failed to refresh DSLR status:', error);
      }
    }
    
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSettingsUpdate = async () => {
    try {
      // Update local state
      setStats(prev => ({
        ...prev,
        eventId: settings.eventId,
        uploaderName: settings.uploaderName,
        watchFolder: settings.watchFolder
      }));

      // Send settings to DSLR service via API
      const response = await fetch('/api/dslr/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_settings',
          settings: {
            eventId: settings.eventId,
            uploaderName: settings.uploaderName,
            watchFolder: settings.watchFolder
          }
        })
      });

      if (response.ok) {
        console.log('✅ DSLR settings updated successfully');
        
        // Show success notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin-notification', {
            detail: {
              type: 'success',
              message: `DSLR settings updated - Event ID: ${settings.eventId}`
            }
          }));
        }
      } else {
        console.error('❌ Failed to update DSLR settings');
      }
    } catch (error) {
      console.error('❌ Error updating DSLR settings:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatUploadTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <span className="truncate">DSLR Monitor</span>
                {/* Real-time indicator */}
                {useRealtime && wsConnected && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <Zap className="h-3 w-3 mr-1" />
                    {isSocketIO ? 'Socket.IO' : 'WebSocket'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span>Monitor upload otomatis dari Nikon D7100</span>
                {/* Connection status */}
                <Badge 
                  variant={wsConnected ? "default" : "secondary"} 
                  className="text-xs"
                >
                  <WifiIcon className="h-3 w-3 mr-1" />
                  {wsConnected ? 
                    `Real-time Connected` : 
                    `API Polling Mode`
                  }
                </Badge>
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
              {/* Real-time toggle */}
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                <Switch
                  checked={useRealtime}
                  onCheckedChange={setUseRealtime}
                />
                <span className="text-xs font-medium">Real-time</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={stats.serviceRunning ? "default" : "destructive"} className="text-xs">
                  {stats.serviceRunning ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Service Running
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Service Stopped
                    </>
                  )}
                </Badge>
                
                {stats.serviceRunning && (
                  <Badge variant={stats.isConnected ? "default" : "secondary"} className="text-xs">
                    {stats.isConnected ? (
                      <>
                        <Camera className="h-3 w-3 mr-1" />
                        Camera Connected
                      </>
                    ) : (
                      <>
                        <Camera className="h-3 w-3 mr-1" />
                        Camera Disconnected
                      </>
                    )}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RotateCcw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Refresh</span>
                </Button>
                
                <Button
                  variant={stats.isProcessing ? "destructive" : "default"}
                  size="sm"
                  onClick={handlePauseResume}
                  disabled={!stats.serviceRunning}
                >
                  {stats.isProcessing ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Resume</span>
                    </>
                  )}
                </Button>
                
                <Button
                  variant={stats.serviceRunning ? "destructive" : "default"}
                  size="sm"
                  onClick={handleServiceToggle}
                >
                  {stats.serviceRunning ? (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Stop Service</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Start Service</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploaded</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUploaded}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedUploads} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upload Speed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uploadSpeed.toFixed(1)} MB/s</div>
            <p className="text-xs text-muted-foreground">
              {stats.queueSize} in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Upload</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats.lastUpload ? formatUploadTime(stats.lastUpload) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Event: {stats.eventId || 'Not set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Folder</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono break-all">
              {stats.watchFolder}
            </div>
            <p className="text-xs text-muted-foreground">
              Monitoring active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              DSLR Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-upload">Auto Upload</Label>
              <Switch
                id="auto-upload"
                checked={settings.autoUpload}
                onCheckedChange={async (checked) => {
                  setSettings(prev => ({ ...prev, autoUpload: checked }));
                  
                  // Sync with DSLR Configuration
                  setDslrSettings(prev => ({ ...prev, autoUpload: checked }));
                  
                  // Immediately control the service
                  try {
                    const action = checked ? 'start' : 'stop';
                    const response = await fetch('/api/dslr/control', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ action })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setStats(prev => ({ 
                        ...prev, 
                        serviceRunning: data.state.isRunning,
                        isProcessing: data.state.isRunning ? prev.isProcessing : false
                      }));
                      
                      // Show notification
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('admin-notification', {
                          detail: {
                            type: 'success',
                            message: `Auto upload ${checked ? 'enabled' : 'disabled'}`
                          }
                        }));
                      }
                    }
                  } catch (error) {
                    console.error('Error toggling auto upload:', error);
                  }
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="event-id">Active Event</Label>
              <select
                id="event-id"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
                value={settings.eventId}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, eventId: e.target.value }))
                }
              >
                <option value="">Select Event</option>
                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {settings.eventId && (
                <div className="text-xs text-muted-foreground mt-1">
                  Selected: {availableEvents.find(e => e.id === settings.eventId)?.name || settings.eventId}
                </div>
              )}
            </div>

            <div className="mobile-form-group">
              <label htmlFor="uploader-name" className="mobile-label">Photographer Name</label>
              <input
                id="uploader-name"
                className="mobile-input"
                value={settings.uploaderName}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, uploaderName: e.target.value }))
                }
                placeholder="Official Photographer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="watch-folder">Watch Folder</Label>
              <Input
                id="watch-folder"
                value={settings.watchFolder}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, watchFolder: e.target.value }))
                }
                placeholder="C:/DCIM/100NIKON"
              />
            </div>

            <Button onClick={handleSettingsUpdate} className="w-full">
              Update Settings
            </Button>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Latest photos uploaded from DSLR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent uploads</p>
                  <p className="text-sm">Photos will appear here when uploaded</p>
                </div>
              ) : (
                recentUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {upload.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      {upload.status === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      {upload.status === 'uploading' && (
                        <Clock className="h-4 w-4 text-yellow-500 animate-spin flex-shrink-0" />
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{upload.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(upload.fileSize)} • {formatUploadTime(upload.uploadTime)}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant={
                      upload.status === 'success' ? 'default' :
                      upload.status === 'failed' ? 'destructive' : 'secondary'
                    } className="text-xs flex-shrink-0">
                      {upload.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-colors ${
                stats.serviceRunning ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <Settings className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">DSLR Service</p>
              <p className="text-xs text-muted-foreground">
                {stats.serviceRunning ? 'Running' : 'Stopped'}
              </p>
              {stats.lastHeartbeat && (
                <p className="text-xs text-muted-foreground">
                  Last: {new Date(stats.lastHeartbeat).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-colors ${
                stats.isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Camera className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Camera</p>
              <p className="text-xs text-muted-foreground">
                {stats.isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.cameraModel}
              </p>
            </div>

            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-colors ${
                stats.isProcessing ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Upload Service</p>
              <p className="text-xs text-muted-foreground">
                {stats.isProcessing ? 'Active' : 'Paused'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.uploadSpeed.toFixed(1)} MB/s
              </p>
            </div>

            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-colors ${
                stats.backupEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <FolderOpen className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Local Backup</p>
              <p className="text-xs text-muted-foreground">
                {stats.backupEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.watchFolder.split('/').pop()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DSLR Configuration */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div className="flex items-center justify-between">
            <h3 className="mobile-card-title flex items-center gap-2">
              <Settings className="h-5 w-5" />
              DSLR Configuration
            </h3>
            {hasUnsavedSettings && (
              <Badge variant="secondary" className="text-xs">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>
        <div className="mobile-card-content space-y-6">
          {/* Auto Upload Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-medium">Auto Upload</p>
              <p className="text-sm text-muted-foreground">
                Automatically upload photos from DSLR to system
              </p>
            </div>
            <Switch
              checked={dslrSettings.autoUpload}
              onCheckedChange={(checked) => handleDslrSettingsChange('autoUpload', checked)}
            />
          </div>

          {/* Camera Settings - Only show when auto upload is enabled */}
          {dslrSettings.autoUpload && (
            <div className="space-y-4 pl-4 border-l-4 border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="camera-model">Camera Model</Label>
                  <select
                    id="camera-model"
                    value={dslrSettings.cameraModel}
                    onChange={(e) => handleDslrSettingsChange('cameraModel', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NIKON_D7100">📷 Nikon D7100</option>
                    <option value="NIKON_D850">📷 Nikon D850</option>
                    <option value="CANON_EOS_5D">📷 Canon EOS 5D</option>
                    <option value="CANON_EOS_R5">📷 Canon EOS R5</option>
                    <option value="SONY_A7III">📷 Sony A7 III</option>
                    <option value="SONY_A7R4">📷 Sony A7R IV</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="watch-folder">Watch Folder</Label>
                  <Input
                    id="watch-folder"
                    type="text"
                    value={dslrSettings.watchFolder}
                    onChange={(e) => handleDslrSettingsChange('watchFolder', e.target.value)}
                    placeholder="C:/DCIM/100NIKON"
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Auto Detect Camera</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically detect camera folder
                    </p>
                  </div>
                  <Switch
                    checked={dslrSettings.autoDetect}
                    onCheckedChange={(checked) => handleDslrSettingsChange('autoDetect', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Local Backup</p>
                    <p className="text-xs text-muted-foreground">
                      Backup photos to local storage
                    </p>
                  </div>
                  <Switch
                    checked={dslrSettings.backupEnabled}
                    onCheckedChange={(checked) => handleDslrSettingsChange('backupEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Upload and camera status notifications
                    </p>
                  </div>
                  <Switch
                    checked={dslrSettings.notificationsEnabled}
                    onCheckedChange={(checked) => handleDslrSettingsChange('notificationsEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Watermark</p>
                    <p className="text-xs text-muted-foreground">
                      Automatic watermark for DSLR photos
                    </p>
                  </div>
                  <Switch
                    checked={dslrSettings.watermarkEnabled}
                    onCheckedChange={(checked) => handleDslrSettingsChange('watermarkEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              onClick={handleSaveDslrSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!hasUnsavedSettings}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
              {hasUnsavedSettings && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>}
            </Button>
            <Button 
              variant="outline"
              onClick={handleResetDslrSettings}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📷 Real-time Status:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className={`font-medium ${stats.serviceRunning ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.serviceRunning ? '✅ Running' : '❌ Stopped'}
                </div>
                <div className="text-blue-800">DSLR Service</div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${stats.backupEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {stats.backupEnabled ? '💾 Active' : '❌ Disabled'}
                </div>
                <div className="text-blue-800">Local Backup</div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${stats.notificationsEnabled ? 'text-purple-600' : 'text-gray-600'}`}>
                  {stats.notificationsEnabled ? '🔔 Enabled' : '🔕 Disabled'}
                </div>
                <div className="text-blue-800">Notifications</div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${stats.watermarkEnabled ? 'text-blue-600' : 'text-gray-600'}`}>
                  {stats.watermarkEnabled ? '🏷️ Active' : '❌ Disabled'}
                </div>
                <div className="text-blue-800">Watermark</div>
              </div>
            </div>
            
            {/* Real-time Status Info */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">Camera Model:</span>
                  <div className="text-blue-700">{stats.cameraModel}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Watch Folder:</span>
                  <div className="text-blue-700 font-mono text-xs break-all">{stats.watchFolder}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Active Event:</span>
                  <div className="text-blue-700">{stats.eventId || 'Not set'}</div>
                </div>
              </div>
              
              {stats.lastHeartbeat && (
                <div className="mt-2 text-xs text-blue-600">
                  Last heartbeat: {new Date(stats.lastHeartbeat).toLocaleString()}
                </div>
              )}
              
              {!stats.serviceRunning && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                  ⚠️ DSLR Service is not running. Start the service to see real-time data.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with error boundary
export default function DSLRMonitor() {
  return (
    <AdminErrorBoundary 
      componentName="DSLR Monitor"
      onError={(error, errorInfo) => {
        // Log error with DSLR context
        console.error('DSLR Monitor Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
      }}
      resetKeys={[]} // Add reset keys if needed
    >
      <DSLRMonitorContent />
    </AdminErrorBoundary>
  );
}