'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  BellOff, 
  Settings, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Volume2,
  VolumeX,
  Filter,
  Trash2,
  RotateCcw
} from 'lucide-react';
import type { Event } from '@/lib/database';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  persistent?: boolean;
  eventId?: string;
  action?: {
    label: string;
    callback: () => void;
  };
  secondaryAction?: {
    label: string;
    callback: () => void;
  };
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showToasts: boolean;
  autoRefresh: boolean;
  priorityFilter: 'low' | 'medium' | 'high' | 'urgent';
  maxNotifications: number;
}

interface RobustNotificationCenterProps {
  events: Event[];
  onRefresh?: () => void;
  onStatusChange?: (eventId: string, newStatus: string) => void;
}

export function RobustNotificationCenter({ 
  events, 
  onRefresh,
  onStatusChange 
}: RobustNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: false,
    showToasts: true,
    autoRefresh: true,
    priorityFilter: 'medium',
    maxNotifications: 50
  });

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (!settings.enabled) return;

    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, settings.maxNotifications);
    });

    // Play sound for high priority
    if (settings.soundEnabled && 
        (notification.priority === 'high' || notification.priority === 'urgent')) {
      playNotificationSound();
    }

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent) {
      const duration = notification.priority === 'urgent' ? 10000 : 
                     notification.priority === 'high' ? 8000 : 
                     notification.priority === 'medium' ? 6000 : 4000;
      
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Smart event monitoring
  useEffect(() => {
    if (!settings.enabled || !settings.autoRefresh) return;

    const checkEvents = () => {
      const now = new Date();
      const today = now.toDateString();

      events.forEach(event => {
        const eventDate = new Date(event.date);
        const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000));

        // Critical: Event today but still draft
        if (event.status === 'draft' && eventDate.toDateString() === today) {
          addNotification({
            type: 'warning',
            title: '🚨 Event Hari Ini Belum Aktif!',
            message: `Event "${event.name}" hari ini masih berstatus draft.`,
            priority: 'urgent',
            persistent: true,
            eventId: event.id,
            action: {
              label: 'Aktifkan Sekarang',
              callback: () => {
                if (onStatusChange) {
                  onStatusChange(event.id, 'active');
                }
              }
            }
          });
        }

        // High: Active event overdue
        if (event.status === 'active' && daysDiff > 1) {
          addNotification({
            type: 'warning',
            title: '⏰ Event Aktif Sudah Lewat',
            message: `Event "${event.name}" masih aktif padahal sudah ${daysDiff} hari lewat.`,
            priority: 'high',
            eventId: event.id,
            action: {
              label: 'Selesaikan',
              callback: () => {
                if (onStatusChange) {
                  onStatusChange(event.id, 'completed');
                }
              }
            }
          });
        }

        // Medium: Ready for archive
        if (event.status === 'completed' && daysDiff > 7 && !event.is_archived) {
          addNotification({
            type: 'info',
            title: '📦 Siap untuk Archive',
            message: `Event "${event.name}" sudah selesai ${daysDiff} hari.`,
            priority: 'medium',
            eventId: event.id,
            action: {
              label: 'Arsipkan',
              callback: () => {
                if (onStatusChange) {
                  onStatusChange(event.id, 'archived');
                }
              }
            }
          });
        }
      });
    };

    checkEvents();
    const interval = setInterval(checkEvents, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [events, settings.enabled, settings.autoRefresh, onStatusChange]);

  // Listen for external notifications
  useEffect(() => {
    const handleExternalNotification = (event: CustomEvent) => {
      const { type, title, message, priority = 'medium', persistent = false } = event.detail;
      addNotification({ type, title, message, priority, persistent });
    };

    window.addEventListener('admin-notification', handleExternalNotification as EventListener);
    return () => {
      window.removeEventListener('admin-notification', handleExternalNotification as EventListener);
    };
  }, []);

  // Filter notifications based on priority
  const filteredNotifications = notifications.filter(notification => {
    const priorityLevels = { low: 0, medium: 1, high: 2, urgent: 3 };
    return priorityLevels[notification.priority] >= priorityLevels[settings.priorityFilter];
  });

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const unreadCount = filteredNotifications.length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {settings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Settings */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Enable</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                >
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {notification.timestamp.toLocaleTimeString()}
                            </span>
                            <div className="flex items-center gap-1">
                              {notification.action && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    notification.action?.callback();
                                    removeNotification(notification.id);
                                  }}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => removeNotification(notification.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export utility functions for external use
export const notificationUtils = {
  showSuccess: (title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('admin-notification', {
      detail: { type: 'success', title, message, priority: 'medium' }
    }));
  },
  
  showError: (title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('admin-notification', {
      detail: { type: 'error', title, message, priority: 'high', persistent: true }
    }));
  },
  
  showWarning: (title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('admin-notification', {
      detail: { type: 'warning', title, message, priority: 'medium' }
    }));
  },
  
  showInfo: (title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('admin-notification', {
      detail: { type: 'info', title, message, priority: 'low' }
    }));
  }
};