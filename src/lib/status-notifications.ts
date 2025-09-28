// Enhanced Status-Based Notifications
import type { Event } from './database';

export interface StatusNotification {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  icon: string;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
}

export class StatusNotificationManager {
  
  static getStatusChangeNotification(
    event: Event, 
    oldStatus: string, 
    newStatus: string
  ): StatusNotification {
    const notifications = {
      'draft->active': {
        type: 'success' as const,
        title: '🎉 Event Dimulai!',
        message: `Event "${event.name}" sekarang aktif. Tamu sudah bisa upload foto dan kirim pesan.`,
        icon: '▶️',
        action: {
          label: 'Lihat Event',
          url: `/event/${event.id}`
        }
      },
      
      'active->paused': {
        type: 'warning' as const,
        title: '⏸️ Event Dijeda',
        message: `Event "${event.name}" dijeda sementara. Upload foto dan pesan dihentikan.`,
        icon: '⏸️',
        action: {
          label: 'Lanjutkan Event',
          callback: () => console.log('Resume event')
        }
      },
      
      'paused->active': {
        type: 'info' as const,
        title: '▶️ Event Dilanjutkan',
        message: `Event "${event.name}" dilanjutkan. Tamu kembali bisa berinteraksi.`,
        icon: '▶️'
      },
      
      'active->completed': {
        type: 'success' as const,
        title: '✅ Event Selesai!',
        message: `Event "${event.name}" telah selesai. Siap untuk backup dan archive.`,
        icon: '✅',
        action: {
          label: 'Backup Event',
          callback: () => console.log('Start backup')
        }
      },
      
      'completed->archived': {
        type: 'info' as const,
        title: '📦 Event Diarsipkan',
        message: `Event "${event.name}" berhasil diarsipkan untuk penyimpanan jangka panjang.`,
        icon: '📦'
      },
      
      'active->cancelled': {
        type: 'error' as const,
        title: '❌ Event Dibatalkan',
        message: `Event "${event.name}" telah dibatalkan. Semua aktivitas dihentikan.`,
        icon: '❌'
      },
      
      'cancelled->active': {
        type: 'success' as const,
        title: '🔄 Event Direaktivasi',
        message: `Event "${event.name}" berhasil diaktifkan kembali.`,
        icon: '🔄'
      },
      
      'archived->active': {
        type: 'warning' as const,
        title: '📤 Event Direaktivasi dari Archive',
        message: `Event "${event.name}" dikeluarkan dari archive dan diaktifkan kembali.`,
        icon: '📤'
      }
    };

    const key = `${oldStatus}->${newStatus}` as keyof typeof notifications;
    return notifications[key] || {
      type: 'info',
      title: 'Status Event Berubah',
      message: `Event "${event.name}" berubah dari ${oldStatus} ke ${newStatus}.`,
      icon: '🔄'
    };
  }

  static getAutoStatusNotifications(healthCheckResult: any): StatusNotification[] {
    const notifications: StatusNotification[] = [];

    // Auto-completed events
    if (healthCheckResult.autoComplete.processed > 0) {
      notifications.push({
        type: 'success',
        title: '✅ Auto-Complete Berhasil',
        message: `${healthCheckResult.autoComplete.processed} event expired otomatis diselesaikan.`,
        icon: '✅'
      });
    }

    // Auto-activated events
    if (healthCheckResult.autoActivate.processed > 0) {
      notifications.push({
        type: 'info',
        title: '🚀 Auto-Activate Berhasil',
        message: `${healthCheckResult.autoActivate.processed} event hari ini otomatis diaktifkan.`,
        icon: '🚀'
      });
    }

    // Archive suggestions
    if (healthCheckResult.archiveSuggestions.length > 0) {
      notifications.push({
        type: 'warning',
        title: '💡 Saran Archive',
        message: `${healthCheckResult.archiveSuggestions.length} event siap untuk diarsipkan.`,
        icon: '💡',
        action: {
          label: 'Lihat Saran',
          callback: () => console.log('Show archive suggestions')
        }
      });
    }

    // Errors
    if (healthCheckResult.summary.errors.length > 0) {
      notifications.push({
        type: 'error',
        title: '⚠️ Ada Error',
        message: `${healthCheckResult.summary.errors.length} event gagal diproses otomatis.`,
        icon: '⚠️',
        action: {
          label: 'Lihat Detail',
          callback: () => console.log('Show errors')
        }
      });
    }

    return notifications;
  }

  static getEventTimelineNotifications(events: Event[]): StatusNotification[] {
    const notifications: StatusNotification[] = [];
    const now = new Date();
    const today = now.toDateString();

    // Events happening today
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.date).toDateString();
      return eventDate === today;
    });

    if (todayEvents.length > 0) {
      const activeToday = todayEvents.filter(e => e.status === 'active').length;
      const draftToday = todayEvents.filter(e => e.status === 'draft').length;

      if (draftToday > 0) {
        notifications.push({
          type: 'warning',
          title: '📅 Event Hari Ini Belum Aktif',
          message: `${draftToday} event hari ini masih berstatus draft.`,
          icon: '📅',
          action: {
            label: 'Aktifkan Sekarang',
            callback: () => console.log('Activate today events')
          }
        });
      }

      if (activeToday > 0) {
        notifications.push({
          type: 'info',
          title: '🎉 Event Hari Ini Aktif',
          message: `${activeToday} event sedang berlangsung hari ini.`,
          icon: '🎉'
        });
      }
    }

    // Overdue active events
    const overdueEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000));
      return event.status === 'active' && daysDiff > 1;
    });

    if (overdueEvents.length > 0) {
      notifications.push({
        type: 'warning',
        title: '⏰ Event Aktif Sudah Lewat',
        message: `${overdueEvents.length} event masih aktif padahal sudah lewat tanggal.`,
        icon: '⏰',
        action: {
          label: 'Auto-Complete',
          callback: () => console.log('Auto-complete overdue events')
        }
      });
    }

    return notifications;
  }

  // Format notification for toast display
  static formatForToast(notification: StatusNotification) {
    return {
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' as const : 'default' as const
    };
  }

  // Format notification for notification center
  static formatForNotificationCenter(notification: StatusNotification) {
    return {
      id: `status-${Date.now()}-${Math.random()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      icon: notification.icon,
      timestamp: new Date().toISOString(),
      action: notification.action,
      read: false
    };
  }
}