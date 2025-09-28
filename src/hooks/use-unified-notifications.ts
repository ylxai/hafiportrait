import React from 'react';
import { useToast } from './use-toast';

// Unified notification system that doesn't conflict with SocketIO
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Check for existing notification systems to avoid conflicts
const hasExistingNotificationSystem = () => {
  try {
    return typeof window !== 'undefined' && 
           (window as any).__notificationSystemActive;
  } catch {
    return false;
  }
};

// Mark this notification system as active
const markNotificationSystemActive = () => {
  if (typeof window !== 'undefined') {
    (window as any).__notificationSystemActive = true;
  }
};

// Global notification queue to prevent spam
let notificationQueue: Array<{ type: NotificationType; options: NotificationOptions }> = [];
let isProcessingQueue = false;

const processNotificationQueue = (toastFn: any) => {
  if (isProcessingQueue || notificationQueue.length === 0) return;
  
  isProcessingQueue = true;
  const { type, options } = notificationQueue.shift()!;
  
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  toastFn({
    variant: type === 'error' ? 'destructive' : 'default',
    title: `${getIcon(type)} ${options.title}`,
    description: options.description,
    duration: options.duration || 5000,
    action: options.action ? {
      altText: options.action.label,
      onClick: options.action.onClick,
      children: options.action.label
    } : undefined,
  });

  // Process next in queue after a short delay
  setTimeout(() => {
    isProcessingQueue = false;
    processNotificationQueue(toastFn);
  }, 300);
};

export function useUnifiedNotifications() {
  const { toast } = useToast();
  
  // Initialize this notification system (anti-conflict)
  React.useEffect(() => {
    if (!hasExistingNotificationSystem()) {
      markNotificationSystemActive();
    }
  }, []);
  
  // Check if running in SocketIO context
  const isSocketIOContext = React.useMemo(() => {
    return typeof window !== 'undefined' && 
           ((window as any).__socketIOActive || (window as any).io);
  }, []);

  const showNotification = React.useCallback((
    type: NotificationType,
    options: NotificationOptions
  ) => {
    // Add to queue to prevent spam
    notificationQueue.push({ type, options });
    processNotificationQueue(toast);
  }, [toast]);

  // Prefixed notification functions to avoid conflicts
  const notifications = React.useMemo(() => ({
    // Event Management
    event: {
      created: (eventName: string) => showNotification('success', {
        title: 'Event Berhasil Dibuat',
        description: `Event "${eventName}" telah berhasil dibuat dan siap digunakan.`,
        duration: 6000
      }),
      updated: (eventName: string) => showNotification('success', {
        title: 'Event Berhasil Diperbarui',
        description: `Event "${eventName}" telah berhasil diperbarui.`,
        duration: 5000
      }),
      deleted: (eventName: string) => showNotification('success', {
        title: 'Event Berhasil Dihapus',
        description: `Event "${eventName}" telah berhasil dihapus dari sistem.`,
        duration: 5000
      }),
    },

    // Upload Management
    upload: {
      success: (fileName: string, tier?: string) => showNotification('success', {
        title: 'Upload Berhasil',
        description: `"${fileName}" berhasil diupload${tier ? ` ke ${tier}` : ''}.`,
        duration: 6000
      }),
      failed: (fileName: string, error?: string) => showNotification('error', {
        title: 'Upload Gagal',
        description: `Gagal mengupload "${fileName}". ${error || 'Silakan coba lagi.'}`,
        duration: 8000
      }),
      fileTooLarge: (fileName: string, maxSize: string = '50MB') => showNotification('error', {
        title: 'File Terlalu Besar',
        description: `"${fileName}" melebihi batas maksimal ${maxSize}. Silakan kompres file terlebih dahulu.`,
        duration: 8000
      }),
      invalidFileType: (fileName: string) => showNotification('error', {
        title: 'Format File Tidak Didukung',
        description: `"${fileName}" memiliki format yang tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.`,
        duration: 8000
      }),
    },

    // Photo Management
    photo: {
      deleted: (fileName: string) => showNotification('success', {
        title: 'Foto Dihapus',
        description: `"${fileName}" telah berhasil dihapus.`,
        duration: 5000
      }),
      liked: (fileName: string) => showNotification('success', {
        title: 'Foto Disukai',
        description: `Anda menyukai "${fileName}".`,
        duration: 3000
      }),
    },

    // System Notifications
    system: {
      connectionError: () => showNotification('error', {
        title: 'Koneksi Bermasalah',
        description: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        duration: 8000
      }),
      sessionExpired: () => showNotification('warning', {
        title: 'Sesi Berakhir',
        description: 'Sesi Anda telah berakhir. Silakan login kembali.',
        duration: 10000,
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/admin/login'
        }
      }),
    },

    // Quick access
    success: (title: string, description?: string) => 
      showNotification('success', { title, description }),
    
    error: (title: string, description?: string) => 
      showNotification('error', { title, description }),
    
    warning: (title: string, description?: string) => 
      showNotification('warning', { title, description }),
    
    info: (title: string, description?: string) => 
      showNotification('info', { title, description })
  }), [showNotification]);

  return {
    ...notifications,
    isSocketIOContext,
    showNotification
  };
}