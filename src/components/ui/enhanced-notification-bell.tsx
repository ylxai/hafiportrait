'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, X, Check, Trash2, Settings, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile';

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

interface EnhancedNotificationBellProps {
  className?: string;
  mobileOptimized?: boolean;
}

export default function EnhancedNotificationBell({ 
  className = '', 
  mobileOptimized = false 
}: EnhancedNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityCount = notifications.filter(n => !n.isRead && (n.priority === 'high' || n.priority === 'critical')).length;
  const hasUnread = unreadCount > 0;
  const hasHighPriority = highPriorityCount > 0;

  // Enhanced mobile detection and optimization
  const isMobileOptimized = mobileOptimized || isMobile;
  const buttonSize = isMobileOptimized ? 'h-12 w-12' : 'h-10 w-10';
  const iconSize = isMobileOptimized ? 'h-6 w-6' : 'h-5 w-5';

  // Initialize notification system with enhanced mobile support
  useEffect(() => {
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
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications
      
      // Mobile haptic feedback
      if (isMobileOptimized && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    };

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
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
      
      // Mobile haptic feedback for high priority
      if (isMobileOptimized && 'vibrate' in navigator && 
          (newNotification.priority === 'high' || newNotification.priority === 'critical')) {
        navigator.vibrate([100, 50, 100]);
      }
    };

    // Enhanced click outside detection for mobile
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isOpen && 
          bellRef.current && !bellRef.current.contains(event.target as Node) &&
          panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSettingsOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('admin-upload-success', handleAdminUpload as EventListener);
      window.addEventListener('admin-upload-failed', handleAdminUpload as EventListener);
      window.addEventListener('dslr-notification', handleDSLRNotification);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      return () => {
        window.removeEventListener('admin-upload-success', handleAdminUpload as EventListener);
        window.removeEventListener('admin-upload-failed', handleAdminUpload as EventListener);
        window.removeEventListener('dslr-notification', handleDSLRNotification);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen, isMobileOptimized]);

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

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.isRead;
      case 'high': return notification.priority === 'high' || notification.priority === 'critical';
      default: return true;
    }
  });

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

  const handleClearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}j`;
    if (diffDays < 7) return `${diffDays}h`;
    return date.toLocaleDateString('id-ID');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 border-red-200 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Enhanced Bell Button - Mobile First */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative ${buttonSize} rounded-full transition-all duration-200 
          flex items-center justify-center
          ${hasHighPriority 
            ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 shadow-lg' 
            : hasUnread 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
          }
          ${isOpen ? 'bg-blue-600 text-white shadow-lg scale-110' : ''}
          touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isMobileOptimized ? 'min-h-[48px] min-w-[48px]' : ''}
        `}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {hasUnread ? (
          <BellRing className={`${iconSize} ${hasHighPriority ? 'animate-bounce' : ''}`} />
        ) : (
          <Bell className={iconSize} />
        )}
        
        {/* Enhanced Notification Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant={hasHighPriority ? "destructive" : "default"}
            className={`
              absolute -top-1 -right-1 flex items-center justify-center p-0 text-xs font-bold rounded-full
              ${isMobileOptimized ? 'h-6 w-6 min-w-[24px]' : 'h-5 w-5 min-w-[20px]'}
              ${hasHighPriority ? 'animate-pulse bg-red-500' : 'bg-blue-500'}
            `}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* High Priority Indicator */}
        {hasHighPriority && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
      </button>

      {/* Enhanced Mobile-First Notification Panel */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div 
            ref={panelRef}
            className="
              fixed top-4 right-2 left-2 z-[99999]
              sm:fixed sm:top-16 sm:right-4 sm:left-4
              lg:fixed lg:top-16 lg:right-4 lg:left-auto lg:w-96
              bg-white rounded-lg shadow-xl border border-gray-200
              max-h-[90vh] sm:max-h-[85vh] lg:max-h-[80vh] overflow-hidden
            "
            style={{
              zIndex: 99999,
              position: 'fixed',
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} baru
                  </Badge>
                )}
                {hasHighPriority && (
                  <Badge variant="destructive" className="text-xs">
                    {highPriorityCount} penting
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {/* Filter Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="h-8 w-8 p-0"
                >
                  <Filter className="h-3 w-3" />
                </Button>
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Filter Settings */}
            {isSettingsOpen && (
              <div className="p-3 border-b bg-gray-50">
                <div className="flex gap-2 flex-wrap">
                  {['all', 'unread', 'high'].map((filterOption) => (
                    <Button
                      key={filterOption}
                      variant={filter === filterOption ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(filterOption as any)}
                      className="text-xs h-7"
                    >
                      {filterOption === 'all' ? 'Semua' : 
                       filterOption === 'unread' ? 'Belum Dibaca' : 'Prioritas Tinggi'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-7 px-2"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Baca Semua
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Hapus Semua
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {filter === 'all' ? 'Tidak ada notifikasi' : 
                     filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 
                     'Tidak ada notifikasi prioritas tinggi'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 hover:bg-gray-50 transition-colors cursor-pointer
                        ${!notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                        ${isMobileOptimized ? 'p-3' : ''}
                      `}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          flex-shrink-0 w-2 h-2 rounded-full mt-2
                          ${notification.priority === 'critical' ? 'bg-red-500 animate-pulse' :
                            notification.priority === 'high' ? 'bg-orange-500' :
                            notification.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}
                        `} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`
                              text-sm font-medium text-gray-900 truncate
                              ${!notification.isRead ? 'font-semibold' : ''}
                            `}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {notification.metadata && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {notification.metadata.eventName && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.metadata.eventName}
                                </Badge>
                              )}
                              {notification.metadata.count && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.metadata.count} foto
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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