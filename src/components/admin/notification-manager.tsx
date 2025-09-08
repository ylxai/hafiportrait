'use client';

import { useState, useEffect } from 'react';
import { useApiWithRecovery } from '@/hooks/use-error-recovery';
import AdminErrorBoundary from '@/components/error/AdminErrorBoundary';
import { NotificationManagerFallback, NetworkErrorFallback } from '@/components/admin/fallback-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  BellOff,
  Send, 
  Users, 
  Settings, 
  History,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit,
  Plus,
  Filter,
  Download,
  Upload as UploadIcon,
  RefreshCw
} from 'lucide-react';

interface NotificationSettings {
  uploadSuccess: boolean;
  uploadFailed: boolean;
  cameraDisconnected: boolean;
  storageWarning: boolean;
  eventMilestone: boolean;
  clientNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationTemplate {
  id: string;
  type: 'upload_success' | 'upload_failed' | 'camera_disconnected' | 'storage_warning' | 'event_milestone';
  title: string;
  message: string;
  isActive: boolean;
}

interface NotificationHistory {
  id: string;
  type: string;
  title: string;
  message: string;
  recipients: number;
  sentAt: string;
  deliveryRate: number;
  openRate: number;
  status: 'sent' | 'failed' | 'pending';
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'photographer' | 'client' | 'guest';
  isActive: boolean;
  subscribedAt: string;
  lastSeen: string;
}

function NotificationManagerContent() {
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'history' | 'subscribers'>('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    uploadSuccess: true,
    uploadFailed: true,
    cameraDisconnected: true,
    storageWarning: true,
    eventMilestone: true,
    clientNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Use error recovery hook for loading settings
  const {
    data: loadedSettings,
    error: loadError,
    isLoading: isLoadingSettings,
    retry: retryLoad,
    canRetry: canRetryLoad
  } = useApiWithRecovery('/api/admin/notifications/settings', {}, {
    maxRetries: 3,
    retryDelay: 2000,
    fallbackData: settings,
    onError: (error, retryCount) => {
      console.error(`Failed to load notification settings (attempt ${retryCount}):`, error);
      
      // Try localStorage fallback on first error
      if (retryCount === 1) {
        try {
          const savedSettings = localStorage.getItem('notification-settings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({ ...prev, ...parsed }));
          }
        } catch (localError) {
          console.error('localStorage fallback also failed:', localError);
        }
      }
    },
    onRecovery: (retryCount) => {
      console.log(`✅ Notification settings loaded after ${retryCount} retries`);
    }
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (loadedSettings && !loadError) {
      setSettings(prev => ({ ...prev, ...loadedSettings }));
    }
  }, [loadedSettings, loadError]);

  // Auto-save settings when changed with API integration
  useEffect(() => {
    const saveSettings = async () => {
      setIsLoading(true);
      try {
        // Save to API first
        const response = await fetch('/api/admin/notifications/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });

        if (response.ok) {
          // Also save to localStorage as backup
          localStorage.setItem('notification-settings', JSON.stringify(settings));
          setLastSaved(new Date());
        } else {
          throw new Error('API save failed');
        }
      } catch (error) {
        console.error('Failed to save notification settings:', error);
        // Fallback to localStorage only
        localStorage.setItem('notification-settings', JSON.stringify(settings));
        setLastSaved(new Date());
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, [settings]);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      type: 'upload_success',
      title: '📸 Foto Baru Diupload',
      message: '{count} foto baru berhasil diupload ke album {albumName}',
      isActive: true
    },
    {
      id: '2',
      type: 'upload_failed',
      title: '❌ Upload Gagal',
      message: 'Upload foto {fileName} gagal. Silakan cek koneksi internet.',
      isActive: true
    },
    {
      id: '3',
      type: 'camera_disconnected',
      title: '📷 Kamera Terputus',
      message: 'Koneksi kamera DSLR terputus. Silakan cek kabel USB.',
      isActive: true
    },
    {
      id: '4',
      type: 'storage_warning',
      title: '💾 Storage Hampir Penuh',
      message: 'Storage tersisa {percentage}%. Silakan backup foto lama.',
      isActive: true
    },
    {
      id: '5',
      type: 'event_milestone',
      title: '🎉 Milestone Event',
      message: '{count} foto telah diupload untuk event {eventName}!',
      isActive: true
    }
  ]);

  const [history, setHistory] = useState<NotificationHistory[]>([
    {
      id: '1',
      type: 'upload_success',
      title: '📸 Foto Baru Diupload',
      message: '5 foto baru berhasil diupload ke album Official',
      recipients: 25,
      sentAt: new Date().toISOString(),
      deliveryRate: 98,
      openRate: 75,
      status: 'sent'
    },
    {
      id: '2',
      type: 'event_milestone',
      title: '🎉 Milestone Event',
      message: '100 foto telah diupload untuk event Wedding Sarah & John!',
      recipients: 45,
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      deliveryRate: 100,
      openRate: 85,
      status: 'sent'
    }
  ]);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    {
      id: '1',
      email: 'photographer@hafiportrait.com',
      name: 'Official Photographer',
      role: 'photographer',
      isActive: true,
      subscribedAt: '2024-01-15T10:00:00Z',
      lastSeen: new Date().toISOString()
    },
    {
      id: '2',
      email: 'admin@hafiportrait.com',
      name: 'Admin',
      role: 'admin',
      isActive: true,
      subscribedAt: '2024-01-15T10:00:00Z',
      lastSeen: new Date().toISOString()
    }
  ]);

  const [stats, setStats] = useState({
    totalSent: 1247,
    deliveryRate: 98.5,
    openRate: 76.3,
    activeSubscribers: 156
  });

  const handleSettingsUpdate = () => {
    // API call to update settings
    console.log('Settings updated:', settings);
  };

  const handleSendTestNotification = async () => {
    try {
      console.log('🧪 Sending test notification...');
      
      // Create test notification for local notification system
      const testNotification = {
        id: `test_${Date.now()}`,
        title: '🧪 Test Notification',
        message: 'This is a test notification from Admin Dashboard',
        type: 'test',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'normal' as const
      };

      // Add to notification history
      const newHistoryItem: NotificationHistory = {
        id: testNotification.id,
        type: 'test',
        title: testNotification.title,
        message: testNotification.message,
        recipients: 1,
        sentAt: testNotification.timestamp,
        deliveryRate: 100,
        openRate: 0,
        status: 'sent'
      };

      setHistory(prev => [newHistoryItem, ...prev]);

      // Trigger browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(testNotification.title, {
          body: testNotification.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'admin-test'
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(testNotification.title, {
            body: testNotification.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'admin-test'
          });
        }
      }

      // Dispatch custom event for notification bell
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-notification', {
          detail: {
            type: 'success',
            message: 'Test notification sent successfully!',
            notification: testNotification
          }
        }));

        // Also dispatch for notification bell update
        window.dispatchEvent(new CustomEvent('new-notification', {
          detail: testNotification
        }));
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        totalSent: prev.totalSent + 1
      }));

      console.log('✅ Test notification sent successfully!');
      
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-notification', {
          detail: {
            type: 'error',
            message: 'Failed to send test notification'
          }
        }));
      }
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'photographer': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show network error fallback if loading failed
  if (loadError && !canRetryLoad) {
    return <NetworkErrorFallback onRetry={retryLoad} componentName="Notification Manager" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span className="truncate">Notification Manager</span>
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="block sm:inline">Kelola notifikasi real-time untuk upload dan event</span>
                {lastSaved && (
                  <span className="block sm:inline sm:ml-2 text-green-600">
                    • Tersimpan {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                onClick={handleSendTestNotification}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                <Send className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">Test</span>
              </Button>
              <Button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                size="sm"
                title="Refresh data"
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              onClick={() => {
                setSettings(prev => ({ ...prev, uploadSuccess: !prev.uploadSuccess }));
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                settings.uploadSuccess 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <UploadIcon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Upload Success</span>
            </button>
            
            <button 
              onClick={() => {
                setSettings(prev => ({ ...prev, cameraDisconnected: !prev.cameraDisconnected }));
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                settings.cameraDisconnected 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <XCircle className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Camera Alert</span>
            </button>
            
            <button 
              onClick={() => {
                setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                settings.soundEnabled 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              {settings.soundEnabled ? <BellRing className="h-5 w-5 mx-auto mb-1" /> : <BellOff className="h-5 w-5 mx-auto mb-1" />}
              <span className="text-xs font-medium">Sound</span>
            </button>
            
            <button 
              onClick={handleSendTestNotification}
              className="p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-center transition-all"
            >
              <Send className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Send Test</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'settings' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'templates' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'history' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">History</span>
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'subscribers' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">Subscribers</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              
              {/* Upload Notifications */}
              <div>
                <h4 className="font-medium mb-3">Upload Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Upload Success</Label>
                      <p className="text-xs text-muted-foreground">Notifikasi saat foto berhasil diupload</p>
                    </div>
                    <Switch
                      checked={settings.uploadSuccess}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, uploadSuccess: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Upload Failed</Label>
                      <p className="text-xs text-muted-foreground">Notifikasi saat upload gagal</p>
                    </div>
                    <Switch
                      checked={settings.uploadFailed}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, uploadFailed: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* System Notifications */}
              <div>
                <h4 className="font-medium mb-3">System Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="mobile-label">Camera Disconnected</label>
                      <p className="text-xs text-muted-foreground">Alert saat kamera terputus</p>
                    </div>
                    <Switch
                      checked={settings.cameraDisconnected}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, cameraDisconnected: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="mobile-label">Storage Warning</label>
                      <p className="text-xs text-muted-foreground">Peringatan storage hampir penuh</p>
                    </div>
                    <Switch
                      checked={settings.storageWarning}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, storageWarning: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Audio & Haptic */}
              <div>
                <h4 className="font-medium mb-3">Audio & Haptic</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="mobile-label">Sound Enabled</label>
                      <p className="text-xs text-muted-foreground">Suara notifikasi</p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, soundEnabled: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="mobile-label">Vibration</label>
                      <p className="text-xs text-muted-foreground">Getaran untuk mobile</p>
                    </div>
                    <Switch
                      checked={settings.vibrationEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, vibrationEnabled: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quiet Hours */}
              <div>
                <h4 className="font-medium mb-3">Quiet Hours</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="mobile-label">Enable Quiet Hours</label>
                      <p className="text-xs text-muted-foreground">Nonaktifkan notifikasi pada jam tertentu</p>
                    </div>
                    <Switch
                      checked={settings.quietHours.enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          quietHours: { ...prev.quietHours, enabled: checked }
                        }))
                      }
                    />
                  </div>
                  
                  {settings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="mobile-form-group">
                        <label className="mobile-label">Start Time</label>
                        <input
                          type="time"
                          className="mobile-input"
                          value={settings.quietHours.start}
                          onChange={(e) => 
                            setSettings(prev => ({ 
                              ...prev, 
                              quietHours: { ...prev.quietHours, start: e.target.value }
                            }))
                          }
                        />
                      </div>
                      <div className="mobile-form-group">
                        <label className="mobile-label">End Time</label>
                        <input
                          type="time"
                          className="mobile-input"
                          value={settings.quietHours.end}
                          onChange={(e) => 
                            setSettings(prev => ({ 
                              ...prev, 
                              quietHours: { ...prev.quietHours, end: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleSettingsUpdate}
                className="w-full"
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
      )}

      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notification Templates</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    // Toggle all templates
                    const allActive = templates.every(t => t.isActive);
                    setTemplates(prev => prev.map(t => ({ ...t, isActive: !allActive })));
                  }}
                  variant="outline"
                  size="sm"
                >
                  {templates.every(t => t.isActive) ? <BellOff className="h-4 w-4 mr-1" /> : <BellRing className="h-4 w-4 mr-1" />}
                  {templates.every(t => t.isActive) ? 'Disable All' : 'Enable All'}
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={(checked) => {
                            setTemplates(prev => prev.map(t => 
                              t.id === template.id ? { ...t, isActive: checked } : t
                            ));
                          }}
                        />
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => {
                            // Duplicate template
                            const newTemplate = { 
                              ...template, 
                              id: Date.now().toString(), 
                              title: `${template.title} (Copy)` 
                            };
                            setTemplates(prev => [...prev, newTemplate]);
                          }}
                          variant="ghost"
                          size="sm"
                          title="Duplicate"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium">{template.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.message}</p>
                    </div>
                    
                    {/* Preview button */}
                    <button 
                      onClick={() => {
                        // Show preview
                        alert(`Preview:\n\nTitle: ${template.title}\nMessage: ${template.message}`);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Preview Template
                    </button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Cari notifikasi..."
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select className="px-3 py-2 border rounded-md text-sm">
                    <option value="">Semua Status</option>
                    <option value="sent">Terkirim</option>
                    <option value="failed">Gagal</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select className="px-3 py-2 border rounded-md text-sm">
                    <option value="">7 Hari Terakhir</option>
                    <option value="today">Hari Ini</option>
                    <option value="week">Minggu Ini</option>
                    <option value="month">Bulan Ini</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification History</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button 
                    onClick={() => {
                      // Clear all history
                      if (confirm('Hapus semua riwayat notifikasi?')) {
                        setHistory([]);
                      }
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada riwayat notifikasi</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.sentAt)}
                            </span>
                          </div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                        </div>
                        <button 
                          onClick={() => {
                            // Show full details
                            alert(`Detail Notifikasi:\n\nTitle: ${item.title}\nMessage: ${item.message}\nRecipients: ${item.recipients}\nSent: ${formatDateTime(item.sentAt)}`);
                          }}
                          className="p-2 hover:bg-muted rounded touch-feedback"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm font-medium">{item.recipients}</p>
                          <p className="text-xs text-muted-foreground">Recipients</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${item.deliveryRate >= 90 ? 'text-green-600' : item.deliveryRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.deliveryRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${item.openRate >= 50 ? 'text-green-600' : item.openRate >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.openRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">Opened</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscribers</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscribers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada subscribers</p>
                </div>
              ) : (
                subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{subscriber.name}</p>
                          <Badge variant={subscriber.isActive ? 'default' : 'secondary'}>
                            {subscriber.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{subscriber.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(subscriber.role)}`}>
                            {subscriber.role}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Last seen: {formatDateTime(subscriber.lastSeen)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Main component with error boundary
export default function NotificationManager() {
  return (
    <AdminErrorBoundary 
      componentName="Notification Manager"
      fallback={<NotificationManagerFallback />}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <NotificationManagerContent />
    </AdminErrorBoundary>
  );
}