'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, X, Check, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { useNotifications } from '@/hooks/use-notifications';
// import { getDSLRNotificationIntegration } from '@/lib/dslr-notification-integration';

interface Notification {
  id: string;
  type: 'upload_success' | 'upload_failed' | 'camera_disconnected' | 'storage_warning' | 'event_milestone' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'upload' | 'system' | 'event' | 'user';
  metadata?: {
    fileName?: string;
    eventName?: string;
    count?: number;
    percentage?: number;
  };
}

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    // Dummy notifications for testing
    {
      id: 'dummy-1',
      type: 'upload_success',
      title: '📸 Foto Berhasil Diupload',
      message: 'test-photo.jpg berhasil diupload ke Test Event',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium',
      category: 'upload',
      metadata: {
        fileName: 'test-photo.jpg',
        eventName: 'Test Event'
      }
    },
    {
      id: 'dummy-2',
      type: 'storage_warning',
      title: '⚠️ Storage Hampir Penuh',
      message: 'Storage sudah mencapai 85% kapasitas',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      isRead: false,
      priority: 'high',
      category: 'system',
      metadata: {
        percentage: 85
      }
    }
  ]);

  // Debug logging
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    // Debug info available in browser dev tools
  }, [isOpen, notifications.length, unreadCount]);

  // Initialize real notification system
  useEffect(() => {
    // const dslrIntegration = getDSLRNotificationIntegration();
    
    // Listen for real upload events from admin dashboard
    const handleAdminUpload = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: type,
        title: getNotificationTitle(type),
        message: data.message || `${data.fileName || 'File'} berhasil diupload`,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: getNotificationPriority(type),
        category: getNotificationCategory(type),
        metadata: {
          fileName: data.fileName,
          eventName: data.eventName,
          count: data.count,
          percentage: data.percentage
        }
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
      
      // Mobile haptic feedback for high priority notifications
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (newNotification.priority === 'high' || newNotification.priority === 'critical') {
          navigator.vibrate([100, 50, 100]); // Pattern: vibrate-pause-vibrate
        } else if (newNotification.priority === 'medium') {
          navigator.vibrate(100); // Single vibration
        }
      }
    };

    // Listen for DSLR upload events
    const handleDSLRNotification = (event: any) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: event.type,
        title: getNotificationTitle(event.type),
        message: event.message || event.data?.message || 'New notification',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: getNotificationPriority(event.type),
        category: getNotificationCategory(event.type),
        metadata: {
          fileName: event.data?.fileName,
          eventName: event.data?.eventName,
          count: event.data?.count,
          percentage: event.data?.percentage
        }
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    };

    // Listen for events
    if (typeof window !== 'undefined') {
      window.addEventListener('admin-upload-success', handleAdminUpload as EventListener);
      window.addEventListener('admin-upload-failed', handleAdminUpload as EventListener);
      window.addEventListener('dslr-notification', handleDSLRNotification);
      
      return () => {
        window.removeEventListener('admin-upload-success', handleAdminUpload as EventListener);
        window.removeEventListener('admin-upload-failed', handleAdminUpload as EventListener);
        window.removeEventListener('dslr-notification', handleDSLRNotification);
      };
    }
  }, []);

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'upload_success': return '📸 Foto Berhasil Diupload';
      case 'upload_failed': return '❌ Upload Gagal';
      case 'upload_start': return '📤 Memulai Upload';
      case 'camera_connected': return '📷 Kamera Terhubung';
      case 'camera_disconnected': return '📷 Kamera Terputus';
      case 'storage_warning': return '⚠️ Storage Hampir Penuh';
      case 'event_milestone': return '🎉 Milestone Tercapai';
      default: return '📢 Notifikasi Baru';
    }
  };

  const getNotificationPriority = (type: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (type) {
      case 'upload_failed': 
      case 'camera_disconnected': 
      case 'storage_warning': return 'high';
      case 'upload_success': 
      case 'event_milestone': return 'medium';
      case 'upload_start': 
      case 'camera_connected': return 'low';
      default: return 'medium';
    }
  };

  const getNotificationCategory = (type: string): 'upload' | 'system' | 'event' | 'user' => {
    switch (type) {
      case 'upload_success':
      case 'upload_failed':
      case 'upload_start': return 'upload';
      case 'camera_connected':
      case 'camera_disconnected':
      case 'storage_warning': return 'system';
      case 'event_milestone': return 'event';
      default: return 'user';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'upload_success': return '✅';
      case 'upload_failed': return '❌';
      case 'camera_disconnected': return '📷';
      case 'storage_warning': return '⚠️';
      case 'event_milestone': return '🎉';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button - Mobile Optimized */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={`
          relative p-3 rounded-full transition-all duration-200 
          min-h-[48px] min-w-[48px] flex items-center justify-center
          ${hasUnread 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
          }
          ${isOpen ? 'bg-blue-600 text-white shadow-lg' : ''}
          touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {hasUnread ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold min-w-[24px] rounded-full animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Mobile-First Notification Panel */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-[99998]"
            onClick={() => {
              setIsOpen(false);
            }}
          />
          
          {/* Notification Panel */}
          <div 
            className="
              fixed top-4 right-2 left-2 z-[99999] 
              sm:fixed sm:top-16 sm:right-4 sm:left-4
              lg:fixed lg:top-16 lg:right-4 lg:left-auto lg:w-96
              bg-white rounded-lg shadow-2xl border border-gray-200
              max-h-[90vh] sm:max-h-[85vh] lg:max-h-[80vh] overflow-hidden
            "
            style={{
              zIndex: 99999,
              position: 'fixed',
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} baru
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-8 px-2"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Baca Semua
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-xs h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Hapus
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Tidak ada notifikasi</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        // Test notification function
                        window.dispatchEvent(new CustomEvent('admin-upload-success', {
                          detail: {
                            type: 'upload_success',
                            data: {
                              fileName: 'new-test-photo.jpg',
                              eventName: 'New Test Event',
                              message: 'Test notifikasi berhasil!'
                            }
                          }
                        }));
                      }}
                      className="block text-xs text-blue-600 hover:text-blue-500 underline"
                    >
                      Test Notifikasi Success
                    </button>
                    <button 
                      onClick={() => {
                        // Test error notification
                        window.dispatchEvent(new CustomEvent('admin-upload-failed', {
                          detail: {
                            type: 'upload_failed',
                            data: {
                              fileName: 'failed-photo.jpg',
                              eventName: 'Test Event',
                              message: 'Upload gagal! Coba lagi.'
                            }
                          }
                        }));
                      }}
                      className="block text-xs text-red-600 hover:text-red-500 underline"
                    >
                      Test Notifikasi Error
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 border-l-4 transition-colors duration-200 group
                        ${notification.isRead ? 'bg-white' : 'bg-blue-50/50'}
                        ${getPriorityColor(notification.priority)}
                        hover:bg-gray-50 active:bg-gray-100 cursor-pointer
                        touch-manipulation
                      `}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`
                              text-sm font-medium truncate
                              ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}
                            `}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <p className={`
                            text-sm mt-1 overflow-hidden
                            ${notification.isRead ? 'text-gray-600' : 'text-gray-800'}
                          `}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {notification.message}
                          </p>
                          
                          {/* Metadata */}
                          {notification.metadata && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {notification.metadata.eventName && (
                                <span>📅 {notification.metadata.eventName}</span>
                              )}
                              {notification.metadata.count && (
                                <span>📊 {notification.metadata.count} foto</span>
                              )}
                              {notification.metadata.percentage && (
                                <span>💾 {notification.metadata.percentage}% terpakai</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions - Mobile Optimized */}
                        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 touch-manipulation"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length > 10 && (
                    <div className="p-4 text-center border-t bg-gray-50">
                      <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                        Lihat semua {notifications.length} notifikasi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}