/**
 * React Hook for Notification Management
 * Provides easy access to notification features and real-time updates via WebSocket/Socket.IO
 * Supports both WebSocket and Socket.IO connections based on NEXT_PUBLIC_USE_SOCKETIO env
 */

import { useState, useEffect, useCallback } from 'react';
import { getWebSocketClient } from '@/lib/websocket-client';
// Firebase removed - using WebSocket/Socket.IO notifications based on NEXT_PUBLIC_USE_SOCKETIO env
import { useToast } from '@/components/ui/toast-notification';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isConnected: boolean;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationHook {
  state: NotificationState;
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearError: () => void;
  reconnect: () => void;
}

export function useNotifications(): NotificationHook {
  const { addToast } = useToast();
  const [state, setState] = useState<NotificationState>({
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'default',
    isConnected: false,
    unreadCount: 0,
    isLoading: false,
    error: null
  });

  // Setup WebSocket connection
  useEffect(() => {
    let wsClient: any = null;
    
    try {
      wsClient = getWebSocketClient();
      
      // Connection status listeners
      const handleConnected = () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        console.log('✅ WebSocket connected');
      };

      const handleDisconnected = () => {
        setState(prev => ({ ...prev, isConnected: false }));
        console.log('🔌 WebSocket disconnected');
      };

      const handleError = (data: any) => {
        setState(prev => ({ ...prev, error: 'WebSocket connection error' }));
        console.error('❌ WebSocket error:', data);
      };

      const handleMaxReconnect = () => {
        setState(prev => ({ ...prev, error: 'Failed to connect to notification service' }));
      };

      // Notification listeners
      const handleNotification = (payload: any) => {
        setState(prev => ({ ...prev, unreadCount: prev.unreadCount + 1 }));
        
        // Show toast notification
        if (payload.showToast && payload.title) {
          addToast({
            type: payload.type === 'upload_success' ? 'success' : 
                  payload.type === 'upload_failed' ? 'error' : 'info',
            title: payload.title,
            message: payload.message,
            duration: payload.persistent ? 0 : 5000
          });
        }
      };

      const handleUploadProgress = (payload: any) => {
        console.log('📤 Upload progress:', payload);
        // Could update a progress indicator here
      };

      const handleCameraStatus = (payload: any) => {
        console.log('📷 Camera status:', payload);
        
        // Show important camera notifications
        if (payload.type === 'camera_disconnected') {
          addToast({
            type: 'warning',
            title: payload.title,
            message: payload.message,
            duration: 0 // Persistent
          });
        }
      };

      const handleSystemStatus = (payload: any) => {
        console.log('⚙️ System status:', payload);
        
        // Show system warnings
        if (payload.type === 'storage_warning') {
          addToast({
            type: 'warning',
            title: payload.title,
            message: payload.message,
            duration: 0 // Persistent
          });
        }
      };

      // Attach listeners
      wsClient.on('connected', handleConnected);
      wsClient.on('disconnected', handleDisconnected);
      wsClient.on('error', handleError);
      wsClient.on('max_reconnect_attempts', handleMaxReconnect);
      wsClient.on('notification', handleNotification);
      wsClient.on('upload_progress', handleUploadProgress);
      wsClient.on('camera_status', handleCameraStatus);
      wsClient.on('system_status', handleSystemStatus);

      return () => {
        // Cleanup listeners
        if (wsClient) {
          wsClient.off('connected', handleConnected);
          wsClient.off('disconnected', handleDisconnected);
          wsClient.off('error', handleError);
          wsClient.off('max_reconnect_attempts', handleMaxReconnect);
          wsClient.off('notification', handleNotification);
          wsClient.off('upload_progress', handleUploadProgress);
          wsClient.off('camera_status', handleCameraStatus);
          wsClient.off('system_status', handleSystemStatus);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up WebSocket:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize WebSocket connection' }));
    }
  }, [addToast]);

  // WebSocket/Socket.IO handles all real-time notifications

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Browser does not support notifications');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isLoading: false
      }));

      if (permission === 'granted') {
        addToast({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'You will now receive browser notifications'
        });
        return true;
      } else {
        addToast({
          type: 'error',
          title: 'Permission Denied',
          message: 'Please enable notifications in your browser settings'
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to request notification permission'
      }));

      addToast({
        type: 'error',
        title: 'Permission Error',
        message: 'Failed to enable notifications'
      });

      return false;
    }
  }, [addToast]);

  // FCM functions removed - using WebSocket + browser notifications only

  const markAsRead = useCallback((notificationId: string): void => {
    try {
      // Send to server via WebSocket
      const wsClient = getWebSocketClient();
      wsClient.send('mark_notification_read', { notificationId });
      
      console.log('✅ Marking notification as read:', notificationId);
      
      // Update local unread count
      setState(prev => ({ 
        ...prev, 
        unreadCount: Math.max(0, prev.unreadCount - 1) 
      }));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback((): void => {
    try {
      // Send to server via WebSocket
      const wsClient = getWebSocketClient();
      wsClient.send('mark_all_notifications_read', {});
      
      console.log('✅ Marking all notifications as read');
      
      setState(prev => ({ ...prev, unreadCount: 0 }));
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }, []);

  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reconnect = useCallback((): void => {
    const wsClient = getWebSocketClient();
    wsClient.reconnect();
    
    addToast({
      type: 'info',
      title: 'Reconnecting',
      message: 'Attempting to reconnect to notification service'
    });
  }, [addToast]);

  return {
    state,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearError,
    reconnect
  };
}