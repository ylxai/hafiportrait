'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { StatusNotificationManager } from '@/lib/status-notifications';
import type { Event } from '@/lib/database';

interface StatusChangeEvent {
  eventId: string;
  eventName: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

interface AutoStatusEvent {
  type: 'health-check' | 'auto-complete' | 'auto-activate' | 'archive-suggestion';
  result: any;
  timestamp: string;
}

export function useStatusNotifications(events: Event[]) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastEventCount, setLastEventCount] = useState(events.length);

  // Listen for status change events
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent<StatusChangeEvent>) => {
      const { eventId, eventName, oldStatus, newStatus } = event.detail;
      
      // Find the event to get full details
      const eventData = events.find(e => e.id === eventId);
      if (!eventData) return;

      // Generate notification
      const notification = StatusNotificationManager.getStatusChangeNotification(
        eventData,
        oldStatus,
        newStatus
      );

      // Show toast
      toast(StatusNotificationManager.formatForToast(notification));

      // Add to notification center
      const centerNotification = StatusNotificationManager.formatForNotificationCenter(notification);
      setNotifications(prev => [centerNotification, ...prev].slice(0, 50));
    };

    const handleAutoStatus = (event: CustomEvent<AutoStatusEvent>) => {
      const { type, result } = event.detail;
      
      const notifications = StatusNotificationManager.getAutoStatusNotifications(result);
      
      notifications.forEach(notification => {
        // Show toast for important notifications
        if (notification.type === 'error' || notification.type === 'warning') {
          toast(StatusNotificationManager.formatForToast(notification));
        }

        // Add to notification center
        const centerNotification = StatusNotificationManager.formatForNotificationCenter(notification);
        setNotifications(prev => [centerNotification, ...prev].slice(0, 50));
      });
    };

    // Listen for custom events
    window.addEventListener('event-status-changed', handleStatusChange as EventListener);
    window.addEventListener('auto-status-completed', handleAutoStatus as EventListener);

    return () => {
      window.removeEventListener('event-status-changed', handleStatusChange as EventListener);
      window.removeEventListener('auto-status-completed', handleAutoStatus as EventListener);
    };
  }, [events, toast]);

  // Detect new events and show notifications
  useEffect(() => {
    if (events.length > lastEventCount) {
      const newEventsCount = events.length - lastEventCount;
      toast({
        title: "🎉 Event Baru Ditambahkan!",
        description: `${newEventsCount} event baru telah dibuat.`,
      });
    }
    setLastEventCount(events.length);
  }, [events.length, lastEventCount, toast]);

  // Generate timeline notifications
  const generateTimelineNotifications = useCallback(() => {
    const timelineNotifs = StatusNotificationManager.getEventTimelineNotifications(events);
    
    timelineNotifs.forEach(notification => {
      // Only show high priority timeline notifications as toast
      if (notification.type === 'warning') {
        toast(StatusNotificationManager.formatForToast(notification));
      }

      // Add all to notification center
      const centerNotification = StatusNotificationManager.formatForNotificationCenter(notification);
      setNotifications(prev => {
        // Avoid duplicates based on title and message
        const exists = prev.some(n => 
          n.title === centerNotification.title && 
          n.message === centerNotification.message
        );
        if (exists) return prev;
        
        return [centerNotification, ...prev].slice(0, 50);
      });
    });
  }, [events, toast]);

  // Auto-generate timeline notifications every 5 minutes
  useEffect(() => {
    generateTimelineNotifications();
    
    const interval = setInterval(generateTimelineNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateTimelineNotifications]);

  // Trigger status change notification
  const triggerStatusChange = useCallback((
    eventId: string, 
    eventName: string, 
    oldStatus: string, 
    newStatus: string
  ) => {
    const event = new CustomEvent('event-status-changed', {
      detail: {
        eventId,
        eventName,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Trigger auto status notification
  const triggerAutoStatus = useCallback((type: string, result: any) => {
    const event = new CustomEvent('auto-status-completed', {
      detail: {
        type,
        result,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Show success notification
  const showSuccess = useCallback((title: string, message: string) => {
    toast({
      title,
      description: message,
    });
  }, [toast]);

  // Show error notification
  const showError = useCallback((title: string, message: string) => {
    toast({
      title,
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Show warning notification
  const showWarning = useCallback((title: string, message: string) => {
    toast({
      title,
      description: message,
    });
  }, [toast]);

  // Show info notification
  const showInfo = useCallback((title: string, message: string) => {
    toast({
      title,
      description: message,
    });
  }, [toast]);

  return {
    notifications,
    setNotifications,
    triggerStatusChange,
    triggerAutoStatus,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    generateTimelineNotifications
  };
}