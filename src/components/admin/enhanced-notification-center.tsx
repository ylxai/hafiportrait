'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Play,
  Pause,
  Settings,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusNotificationManager } from "@/lib/status-notifications";
import type { Event } from "@/lib/database";

interface AdminNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'status' | 'auto' | 'timeline' | 'system';
  title: string;
  message: string;
  icon: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    callback: () => void;
  };
  eventId?: string;
  eventName?: string;
}

interface EnhancedNotificationCenterProps {
  events: Event[];
  onRefresh?: () => void;
}

export function EnhancedNotificationCenter({ 
  events, 
  onRefresh 
}: EnhancedNotificationCenterProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate notifications from events
  useEffect(() => {
    generateNotifications();
  }, [events]);

  // Auto refresh notifications every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      generateNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, events]);

  const generateNotifications = () => {
    const newNotifications: AdminNotification[] = [];

    // Timeline notifications
    const timelineNotifs = StatusNotificationManager.getEventTimelineNotifications(events);
    timelineNotifs.forEach(notif => {
      newNotifications.push({
        id: `timeline-${Date.now()}-${Math.random()}`,
        type: notif.type,
        category: 'timeline',
        title: notif.title,
        message: notif.message,
        icon: notif.icon,
        timestamp: new Date().toISOString(),
        read: false,
        priority: notif.type === 'warning' ? 'high' : 'medium',
        action: notif.action ? { 
          label: notif.action.label, 
          callback: notif.action.callback || (() => {})
        } : undefined
      });
    });

    // Status-based notifications
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000));

      // Overdue active events
      if (event.status === 'active' && daysDiff > 1) {
        newNotifications.push({
          id: `overdue-${event.id}`,
          type: 'warning',
          category: 'status',
          title: '⏰ Event Aktif Sudah Lewat',
          message: `Event "${event.name}" masih aktif padahal sudah ${daysDiff} hari lewat tanggal.`,
          icon: '⏰',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'high',
          eventId: event.id,
          eventName: event.name,
          action: {
            label: 'Selesaikan Event',
            callback: () => handleCompleteEvent(event.id)
          }
        });
      }

      // Draft events today
      if (event.status === 'draft' && eventDate.toDateString() === now.toDateString()) {
        newNotifications.push({
          id: `draft-today-${event.id}`,
          type: 'warning',
          category: 'timeline',
          title: '📅 Event Hari Ini Belum Aktif',
          message: `Event "${event.name}" hari ini masih berstatus draft.`,
          icon: '📅',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'high',
          eventId: event.id,
          eventName: event.name,
          action: {
            label: 'Aktifkan Sekarang',
            callback: () => handleActivateEvent(event.id)
          }
        });
      }

      // Completed events ready for archive
      if (event.status === 'completed' && daysDiff > 7 && !event.is_archived) {
        newNotifications.push({
          id: `archive-ready-${event.id}`,
          type: 'info',
          category: 'status',
          title: '📦 Siap untuk Archive',
          message: `Event "${event.name}" sudah selesai ${daysDiff} hari, siap diarsipkan.`,
          icon: '📦',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          eventId: event.id,
          eventName: event.name,
          action: {
            label: 'Arsipkan',
            callback: () => handleArchiveEvent(event.id)
          }
        });
      }

      // Low activity events
      if (event.status === 'active' && event.photo_count === 0 && event.message_count === 0 && daysDiff >= 0) {
        newNotifications.push({
          id: `low-activity-${event.id}`,
          type: 'info',
          category: 'status',
          title: '📊 Event Tidak Ada Aktivitas',
          message: `Event "${event.name}" aktif tapi belum ada foto atau pesan dari tamu.`,
          icon: '📊',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'low',
          eventId: event.id,
          eventName: event.name
        });
      }
    });

    // System notifications
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'active').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;

    if (activeEvents > 5) {
      newNotifications.push({
        id: `many-active-${Date.now()}`,
        type: 'warning',
        category: 'system',
        title: '⚡ Banyak Event Aktif',
        message: `Anda memiliki ${activeEvents} event aktif. Pertimbangkan untuk menyelesaikan yang sudah lewat.`,
        icon: '⚡',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium'
      });
    }

    if (completedEvents > 10) {
      newNotifications.push({
        id: `many-completed-${Date.now()}`,
        type: 'info',
        category: 'system',
        title: '📈 Banyak Event Selesai',
        message: `${completedEvents} event sudah selesai. Pertimbangkan untuk backup dan archive.`,
        icon: '📈',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'low'
      });
    }

    // Update notifications (merge with existing, avoid duplicates)
    setNotifications(prev => {
      const existingIds = prev.map(n => n.id);
      const uniqueNew = newNotifications.filter(n => !existingIds.includes(n.id));
      return [...prev, ...uniqueNew].slice(-50); // Keep last 50 notifications
    });
  };

  const handleCompleteEvent = (eventId: string) => {
    // This would call the status change API
    console.log('Complete event:', eventId);
    toast({
      title: "Event Diselesaikan",
      description: "Event berhasil diubah ke status completed.",
    });
  };

  const handleActivateEvent = (eventId: string) => {
    console.log('Activate event:', eventId);
    toast({
      title: "Event Diaktifkan",
      description: "Event berhasil diaktifkan.",
    });
  };

  const handleArchiveEvent = (eventId: string) => {
    console.log('Archive event:', eventId);
    toast({
      title: "Event Diarsipkan",
      description: "Event berhasil diarsipkan.",
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'high':
        filtered = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
        break;
      default:
        filtered = notifications;
    }

    return filtered.sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => 
    (n.priority === 'high' || n.priority === 'urgent') && !n.read
  ).length;

  const getNotificationIcon = (notification: AdminNotification) => {
    const iconMap = {
      success: <CheckCircle className="w-4 h-4 text-green-600" />,
      warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      error: <XCircle className="w-4 h-4 text-red-600" />,
      info: <Info className="w-4 h-4 text-blue-600" />
    };
    return iconMap[notification.type];
  };

  const getPriorityBadge = (priority: string) => {
    const badgeMap = {
      urgent: <Badge variant="destructive" className="text-xs">Urgent</Badge>,
      high: <Badge variant="destructive" className="text-xs bg-orange-500">High</Badge>,
      medium: <Badge variant="secondary" className="text-xs">Medium</Badge>,
      low: <Badge variant="outline" className="text-xs">Low</Badge>
    };
    return badgeMap[priority as keyof typeof badgeMap];
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {highPriorityCount > 0 && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 shadow-lg border z-50 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  title={autoRefresh ? "Disable auto refresh" : "Enable auto refresh"}
                >
                  {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('high')}
              >
                High ({highPriorityCount})
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-3 h-3 mr-1" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {getFilteredNotifications().length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {getFilteredNotifications().map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getNotificationIcon(notification)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {notification.title}
                              </p>
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {new Date(notification.timestamp).toLocaleTimeString('id-ID')}
                              </span>
                              {notification.action && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (notification.action?.callback) {
                                      notification.action.callback();
                                    }
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs h-6"
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}