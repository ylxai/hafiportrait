'use client';

import { useState, useEffect } from 'react';
import { EnhancedToastContainer, type EnhancedToastProps } from '@/components/ui/enhanced-toast';
import { EnhancedNotificationCenter } from './enhanced-notification-center';
import { useStatusNotifications } from '@/hooks/use-status-notifications';
import type { Event } from '@/lib/database';

interface SmartNotificationManagerProps {
  events: Event[];
  onRefresh?: () => void;
  onStatusChange?: (eventId: string, newStatus: string) => void;
}

export function SmartNotificationManager({ 
  events, 
  onRefresh,
  onStatusChange 
}: SmartNotificationManagerProps) {
  const [toasts, setToasts] = useState<EnhancedToastProps[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    showToasts: true,
    autoRefresh: true,
    soundEnabled: false,
    priorityFilter: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  const {
    notifications,
    triggerStatusChange,
    triggerAutoStatus,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useStatusNotifications(events);

  // Enhanced toast management
  const addToast = (toast: Omit<EnhancedToastProps, 'id' | 'onDismiss'>) => {
    if (!notificationSettings.showToasts) return;

    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: EnhancedToastProps = {
      ...toast,
      id,
      onDismiss: removeToast
    };

    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Max 5 toasts

    // Play sound for high priority notifications
    if (notificationSettings.soundEnabled && 
        (toast.priority === 'high' || toast.priority === 'urgent')) {
      playNotificationSound();
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  // Smart notification triggers based on events
  useEffect(() => {
    const checkEventConditions = () => {
      const now = new Date();
      const today = now.toDateString();

      events.forEach(event => {
        const eventDate = new Date(event.date);
        const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000));

        // Critical: Event today but still draft
        if (event.status === 'draft' && eventDate.toDateString() === today) {
          addToast({
            type: 'warning',
            title: '🚨 Event Hari Ini Belum Aktif!',
            message: `Event "${event.name}" hari ini masih berstatus draft.`,
            priority: 'urgent',
            persistent: true,
            action: {
              label: 'Aktifkan Sekarang',
              callback: () => {
                if (onStatusChange) {
                  onStatusChange(event.id, 'active');
                  triggerStatusChange(event.id, event.name, 'draft', 'active');
                }
              }
            },
            secondaryAction: {
              label: 'Lihat Event',
              callback: () => window.open(`/event/${event.id}`, '_blank')
            }
          });
        }

        // High: Active event overdue
        if (event.status === 'active' && daysDiff > 1) {
          addToast({
            type: 'warning',
            title: '⏰ Event Aktif Sudah Lewat',
            message: `Event "${event.name}" masih aktif padahal sudah ${daysDiff} hari lewat.`,
            priority: 'high',
            action: {
              label: 'Selesaikan',
              callback: () => {
                if (onStatusChange) {
                  onStatusChange(event.id, 'completed');
                  triggerStatusChange(event.id, event.name, 'active', 'completed');
                }
              }
            }
          });
        }

        // Medium: Ready for archive
        if (event.status === 'completed' && daysDiff > 7 && !event.is_archived) {
          addToast({
            type: 'info',
            title: '📦 Siap untuk Archive',
            message: `Event "${event.name}" sudah selesai ${daysDiff} hari.`,
            priority: 'medium',
            action: {
              label: 'Arsipkan',
              callback: () => {
                if (onStatusChange) {
                  onStatusChange(event.id, 'archived');
                  triggerStatusChange(event.id, event.name, 'completed', 'archived');
                }
              }
            }
          });
        }

        // Low: No activity in active event
        if (event.status === 'active' && 
            event.photo_count === 0 && 
            event.message_count === 0 && 
            daysDiff >= 0) {
          addToast({
            type: 'info',
            title: '📊 Event Tidak Ada Aktivitas',
            message: `Event "${event.name}" aktif tapi belum ada interaksi tamu.`,
            priority: 'low',
            duration: 8000
          });
        }
      });

      // System-level notifications
      const activeEvents = events.filter(e => e.status === 'active').length;
      const completedEvents = events.filter(e => e.status === 'completed').length;

      if (activeEvents > 5) {
        addToast({
          type: 'warning',
          title: '⚡ Banyak Event Aktif',
          message: `${activeEvents} event aktif. Pertimbangkan menyelesaikan yang sudah lewat.`,
          priority: 'medium',
          action: {
            label: 'Auto Complete',
            callback: () => {
              // Trigger auto complete
              fetch('/api/admin/events/auto-status?action=auto-complete')
                .then(res => res.json())
                .then(result => {
                  triggerAutoStatus('auto-complete', result);
                  showSuccess('Auto Complete Selesai', `${result.processed} event diselesaikan`);
                });
            }
          }
        });
      }
    };

    // Check conditions on mount and every 5 minutes
    checkEventConditions();
    const interval = setInterval(checkEventConditions, 10 * 60 * 1000); // Reduced from 5min to 10min

    return () => clearInterval(interval);
  }, [events, onStatusChange, triggerStatusChange, triggerAutoStatus, showSuccess]);

  // Listen for external status changes
  useEffect(() => {
    const handleExternalStatusChange = (event: CustomEvent) => {
      const { eventName, oldStatus, newStatus } = event.detail;
      
      const statusMessages = {
        'draft->active': { icon: '🎉', title: 'Event Diaktifkan!', type: 'success' as const },
        'active->paused': { icon: '⏸️', title: 'Event Dijeda', type: 'warning' as const },
        'paused->active': { icon: '▶️', title: 'Event Dilanjutkan', type: 'info' as const },
        'active->completed': { icon: '✅', title: 'Event Selesai!', type: 'success' as const },
        'completed->archived': { icon: '📦', title: 'Event Diarsipkan', type: 'info' as const },
        'active->cancelled': { icon: '❌', title: 'Event Dibatalkan', type: 'error' as const }
      };

      const key = `${oldStatus}->${newStatus}` as keyof typeof statusMessages;
      const config = statusMessages[key];

      if (config) {
        addToast({
          type: config.type,
          title: config.title,
          message: `Event "${eventName}" berhasil diubah statusnya.`,
          icon: config.icon,
          priority: config.type === 'error' ? 'high' : 'medium',
          duration: 6000
        });
      }
    };

    window.addEventListener('event-status-changed', handleExternalStatusChange as EventListener);
    return () => {
      window.removeEventListener('event-status-changed', handleExternalStatusChange as EventListener);
    };
  }, []);

  // Auto status completion notifications
  const handleAutoStatusResult = (type: string, result: any) => {
    if (result.processed > 0) {
      addToast({
        type: 'success',
        title: `✅ ${type === 'auto-complete' ? 'Auto Complete' : 'Auto Activate'} Berhasil`,
        message: `${result.processed} event berhasil diproses otomatis.`,
        priority: 'medium',
        action: {
          label: 'Lihat Detail',
          callback: () => {
            if (onRefresh) onRefresh();
          }
        }
      });
    }

    if (result.results && result.results.some((r: any) => r.status === 'error')) {
      const errorCount = result.results.filter((r: any) => r.status === 'error').length;
      addToast({
        type: 'error',
        title: '⚠️ Ada Error dalam Auto Status',
        message: `${errorCount} event gagal diproses otomatis.`,
        priority: 'high',
        persistent: true
      });
    }
  };

  // Notification settings panel
  const NotificationSettings = () => (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h4 className="font-medium mb-3">Notification Settings</h4>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notificationSettings.showToasts}
            onChange={(e) => setNotificationSettings(prev => ({
              ...prev,
              showToasts: e.target.checked
            }))}
          />
          <span className="text-sm">Show Toast Notifications</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notificationSettings.autoRefresh}
            onChange={(e) => setNotificationSettings(prev => ({
              ...prev,
              autoRefresh: e.target.checked
            }))}
          />
          <span className="text-sm">Auto Refresh Notifications</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notificationSettings.soundEnabled}
            onChange={(e) => setNotificationSettings(prev => ({
              ...prev,
              soundEnabled: e.target.checked
            }))}
          />
          <span className="text-sm">Sound Alerts (High Priority)</span>
        </label>

        <div>
          <label className="text-sm font-medium">Minimum Priority for Toasts:</label>
          <select
            value={notificationSettings.priorityFilter}
            onChange={(e) => setNotificationSettings(prev => ({
              ...prev,
              priorityFilter: e.target.value as any
            }))}
            className="w-full mt-1 p-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent Only</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Enhanced Notification Center */}
      <EnhancedNotificationCenter 
        events={events} 
        onRefresh={onRefresh}
      />

      {/* Enhanced Toast Container */}
      <EnhancedToastContainer 
        toasts={toasts}
        onDismiss={removeToast}
      />

      {/* Expose methods for external use */}
      <div style={{ display: 'none' }}>
        <div data-notification-manager="true" data-methods={JSON.stringify({
          addToast: 'addToast',
          showSuccess: 'showSuccess',
          showError: 'showError',
          showWarning: 'showWarning',
          showInfo: 'showInfo',
          handleAutoStatusResult: 'handleAutoStatusResult'
        })} />
      </div>
    </div>
  );
}