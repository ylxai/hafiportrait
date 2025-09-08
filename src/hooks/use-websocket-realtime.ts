/**
 * React Hook untuk WebSocket Real-time Data
 * Menangani koneksi WebSocket dan subscription ke channel tertentu
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebSocketClient, WebSocketMessage } from '@/lib/websocket-client';

interface UseWebSocketOptions {
  channels?: string[];
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  connectionAttempts: number;
}

export function useWebSocketRealtime(options: UseWebSocketOptions = {}) {
  const {
    channels = [],
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    connectionAttempts: 0
  });

  const wsClient = useRef(getWebSocketClient());
  const subscribedChannels = useRef<Set<string>>(new Set());

  // Subscribe to channels
  const subscribe = useCallback((channel: string) => {
    if (!subscribedChannels.current.has(channel)) {
      subscribedChannels.current.add(channel);
      wsClient.current.send('subscribe', { channel });
      console.log(`📡 Subscribed to channel: ${channel}`);
    }
  }, []);

  // Unsubscribe from channels
  const unsubscribe = useCallback((channel: string) => {
    if (subscribedChannels.current.has(channel)) {
      subscribedChannels.current.delete(channel);
      wsClient.current.send('unsubscribe', { channel });
      console.log(`📡 Unsubscribed from channel: ${channel}`);
    }
  }, []);

  // Send message
  const sendMessage = useCallback((type: string, payload: any) => {
    wsClient.current.send(type, payload);
  }, []);

  // Get current status for a channel
  const getCurrentStatus = useCallback((channel: string) => {
    wsClient.current.send('get_status', { channel });
  }, []);

  // Setup event listeners
  useEffect(() => {
    const client = wsClient.current;

    // Connection events
    const handleConnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null
      }));
      
      // Subscribe to initial channels
      channels.forEach(channel => subscribe(channel));
      
      onConnect?.();
    };

    const handleDisconnect = (data: any) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: data.reason || 'Connection lost'
      }));
      
      subscribedChannels.current.clear();
      onDisconnect?.();
    };

    const handleError = (data: any) => {
      setState(prev => ({
        ...prev,
        error: data.error?.message || 'WebSocket error',
        isConnecting: false
      }));
      
      onError?.(data.error);
    };

    const handleMessage = (data: any) => {
      setState(prev => ({
        ...prev,
        lastMessage: {
          type: 'message',
          payload: data,
          timestamp: new Date().toISOString()
        }
      }));
      
      onMessage?.({
        type: 'message',
        payload: data,
        timestamp: new Date().toISOString()
      });
    };

    // Register event listeners
    client.on('connected', handleConnect);
    client.on('disconnected', handleDisconnect);
    client.on('error', handleError);
    client.on('dslr_status', handleMessage);
    client.on('backup_status', handleMessage);
    client.on('backup_progress', handleMessage);
    client.on('camera_status', handleMessage);
    client.on('upload_progress', handleMessage);
    client.on('notification', handleMessage);

    // Cleanup
    return () => {
      client.off('connected', handleConnect);
      client.off('disconnected', handleDisconnect);
      client.off('error', handleError);
      client.off('dslr_status', handleMessage);
      client.off('backup_status', handleMessage);
      client.off('backup_progress', handleMessage);
      client.off('camera_status', handleMessage);
      client.off('upload_progress', handleMessage);
      client.off('notification', handleMessage);
    };
  }, [channels, subscribe, onConnect, onDisconnect, onError, onMessage]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && !state.isConnected && !state.isConnecting) {
      setState(prev => ({ ...prev, isConnecting: true }));
    }
  }, [autoConnect, state.isConnected, state.isConnecting]);

  return {
    // State
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastMessage: state.lastMessage,
    connectionAttempts: state.connectionAttempts,
    
    // Actions
    subscribe,
    unsubscribe,
    sendMessage,
    getCurrentStatus,
    
    // Connection control
    reconnect: () => wsClient.current.reconnect(),
    disconnect: () => wsClient.current.close(),
    
    // Status
    getConnectionStatus: () => wsClient.current.getStatus()
  };
}

// Specialized hooks for specific use cases

/**
 * Hook untuk DSLR real-time monitoring
 */
export function useDSLRRealtime() {
  const [dslrStatus, setDslrStatus] = useState<any>(null);
  const [cameraStatus, setCameraStatus] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<any>(null);

  const { isConnected, subscribe, unsubscribe, getCurrentStatus } = useWebSocketRealtime({
    channels: ['dslr'],
    onMessage: (message) => {
      switch (message.payload?.type || message.type) {
        case 'dslr_status':
          setDslrStatus(message.payload);
          break;
        case 'camera_status':
          setCameraStatus(message.payload);
          break;
        case 'upload_progress':
          setUploadProgress(message.payload);
          break;
      }
    }
  });

  useEffect(() => {
    if (isConnected) {
      getCurrentStatus('dslr');
    }
  }, [isConnected, getCurrentStatus]);

  return {
    isConnected,
    dslrStatus,
    cameraStatus,
    uploadProgress,
    subscribe,
    unsubscribe,
    refreshStatus: () => getCurrentStatus('dslr'),
    // Compatibility properties for Socket.IO version
    transport: 'websocket',
    connectionMode: isConnected ? 'realtime' : 'polling',
    error: null,
    isRealTimeEnabled: true,
    notifications: [],
    toggleRealTime: () => {},
    clearNotifications: () => {}
  };
}

/**
 * Hook untuk Backup real-time monitoring
 */
export function useBackupRealtime() {
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [backupProgress, setBackupProgress] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { isConnected, subscribe, unsubscribe, getCurrentStatus } = useWebSocketRealtime({
    channels: ['backup'],
    onMessage: (message) => {
      switch (message.payload?.type || message.type) {
        case 'backup_status':
          setBackupStatus(message.payload);
          break;
        case 'backup_progress':
          setBackupProgress(message.payload);
          break;
        case 'notification':
          if (message.payload?.type?.includes('backup')) {
            setNotifications(prev => [message.payload, ...prev.slice(0, 9)]);
          }
          break;
      }
    }
  });

  useEffect(() => {
    if (isConnected) {
      getCurrentStatus('backup');
    }
  }, [isConnected, getCurrentStatus]);

  return {
    isConnected,
    backupStatus,
    backupProgress,
    notifications,
    subscribe,
    unsubscribe,
    refreshStatus: () => getCurrentStatus('backup'),
    clearNotifications: () => setNotifications([])
  };
}

/**
 * Hook untuk System notifications
 */
export function useSystemNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);

  const { isConnected } = useWebSocketRealtime({
    channels: ['system', 'dslr', 'backup'],
    onMessage: (message) => {
      if (message.payload?.type === 'notification') {
        const notification = message.payload;
        
        setNotifications(prev => [notification, ...prev.slice(0, 19)]);
        
        if (notification.priority === 'critical') {
          setCriticalAlerts(prev => [notification, ...prev.slice(0, 4)]);
        }
      }
    }
  });

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissCriticalAlert = useCallback((id: string) => {
    setCriticalAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    notifications,
    criticalAlerts,
    dismissNotification,
    dismissCriticalAlert,
    clearAllNotifications,
    hasUnreadCritical: criticalAlerts.length > 0,
    unreadCount: notifications.length,
    // Compatibility properties for Socket.IO version
    markAsRead: () => {},
    clearNotifications: clearAllNotifications
  };
}