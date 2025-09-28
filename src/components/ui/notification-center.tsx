'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, X, Check, Trash2, Filter, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: string;
  type: 'upload_success' | 'upload_failed' | 'camera_disconnected' | 'storage_warning' | 'event_milestone' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'upload' | 'system' | 'event' | 'user';
  actionUrl?: string;
  metadata?: {
    fileName?: string;
    eventName?: string;
    count?: number;
    percentage?: number;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'upload' | 'system' | 'event'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'upload':
        return notification.category === 'upload';
      case 'system':
        return notification.category === 'system';
      case 'event':
        return notification.category === 'event';
      default:
        return true;
    }
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
    return `${Math.floor(diffInMinutes / 1440)} hari lalu`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'upload_success': return '✅';
      case 'upload_failed': return '❌';
      case 'camera_disconnected': return '📷';
      case 'storage_warning': return '💾';
      case 'event_milestone': return '🎉';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action: 'read' | 'delete') => {
    selectedNotifications.forEach(id => {
      if (action === 'read') {
        onMarkAsRead(id);
      } else {
        onDelete(id);
      }
    });
    setSelectedNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99998]"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l shadow-xl z-[99999] transform transition-transform duration-300 ease-out"
        style={{ zIndex: 99999, transform: 'translateZ(0)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              <h2 className="font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md touch-feedback"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto p-2 border-b bg-muted/20 scrollbar-hide">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'upload', label: 'Upload', count: notifications.filter(n => n.category === 'upload').length },
              { key: 'system', label: 'System', count: notifications.filter(n => n.category === 'system').length },
              { key: 'event', label: 'Event', count: notifications.filter(n => n.category === 'event').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap touch-feedback
                  ${filter === tab.key 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full
                    ${filter === tab.key 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-muted-foreground/20'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border-b">
              <span className="text-sm font-medium">
                {selectedNotifications.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="mobile-btn mobile-btn-secondary text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="mobile-btn mobile-btn-destructive text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-500 touch-feedback"
                disabled={unreadCount === 0}
              >
                Mark all as read
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClearAll}
                className="text-sm text-red-600 hover:text-red-500 touch-feedback"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' ? 'All caught up!' : `No ${filter} notifications`}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-muted/50 transition-colors cursor-pointer
                      ${!notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}
                      ${selectedNotifications.includes(notification.id) ? 'bg-blue-100' : ''}
                    `}
                    onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNotification(notification.id);
                        }}
                        className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center touch-feedback
                          ${selectedNotifications.includes(notification.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        {selectedNotifications.includes(notification.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>

                      {/* Notification Icon */}
                      <div className="text-lg flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                              }}
                              className="p-1 hover:bg-muted rounded touch-feedback"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>

                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {notification.metadata.fileName && (
                              <span>📁 {notification.metadata.fileName}</span>
                            )}
                            {notification.metadata.eventName && (
                              <span>🎉 {notification.metadata.eventName}</span>
                            )}
                            {notification.metadata.count && (
                              <span>📊 {notification.metadata.count} items</span>
                            )}
                            {notification.metadata.percentage && (
                              <span>📈 {notification.metadata.percentage}%</span>
                            )}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>

                        {/* Action Button */}
                        {notification.actionUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(notification.actionUrl, '_blank');
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-500 font-medium touch-feedback"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}