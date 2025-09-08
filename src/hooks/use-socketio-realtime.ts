/**
 * React Hooks untuk Socket.IO Real-time Data
 * Enhanced version dengan room management, mobile optimization, dan auto-fallback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocketIOClient, SocketIOMessage, NotificationPayload } from '@/lib/socketio-client';

// Generic Socket.IO hook
export function useSocketIORealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string>('unknown');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef(getSocketIOClient());

  useEffect(() => {
    const client = clientRef.current;

    // Connection event handlers
    const handleConnected = (data: any) => {
      setIsConnected(true);
      setTransport(data.transport || 'unknown');
      setError(null);
    };

    const handleDisconnected = (data: any) => {
      setIsConnected(false);
      setError(data.reason || 'Disconnected');
    };

    const handleConnectError = (data: any) => {
      setError(data.error || 'Connection error');
    };

    const handleServerInfo = (info: any) => {
      setConnectionInfo(info);
    };

    const handleTransportUpgrade = (data: any) => {
      setTransport(data.transport);
    };

    // Register event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('connect_error', handleConnectError);
    client.on('server-info', handleServerInfo);
    client.on('transport-upgrade', handleTransportUpgrade);

    // Initial status
    setIsConnected(client.getStatus() === 'connected');
    const info = client.getConnectionInfo();
    setTransport(info.transport);
    setConnectionInfo(info.connectionInfo);

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('connect_error', handleConnectError);
      client.off('server-info', handleServerInfo);
      client.off('transport-upgrade', handleTransportUpgrade);
    };
  }, []);

  const joinRoom = useCallback((roomName: string) => {
    clientRef.current.joinRoom(roomName);
  }, []);

  const leaveRoom = useCallback((roomName: string) => {
    clientRef.current.leaveRoom(roomName);
  }, []);

  const sendMessage = useCallback((type: string, payload: any, room?: string) => {
    clientRef.current.send(type, payload, room);
  }, []);

  const reconnect = useCallback(() => {
    clientRef.current.reconnect();
  }, []);

  return {
    isConnected,
    transport,
    connectionInfo,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
    reconnect,
    client: clientRef.current
  };
}

// DSLR monitoring hook dengan Socket.IO
export function useDSLRRealtimeSocketIO() {
  const [dslrStatus, setDslrStatus] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  
  const clientRef = useRef(getSocketIOClient());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomJoinedRef = useRef(false);

  // Polling fallback function
  const pollDslrStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/dslr/status');
      if (response.ok) {
        const data = await response.json();
        setDslrStatus(data);
        setError(null);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ DSLR polling error:', error);
      setError(error instanceof Error ? error.message : 'Polling failed');
    }
  }, []);

  // Start/stop polling
  const startPolling = useCallback((interval: number = 30000) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(pollDslrStatus, interval);
    console.log(`🔄 DSLR polling started (${interval}ms interval)`);
  }, [pollDslrStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('⏹️ DSLR polling stopped');
    }
  }, []);

  // Socket.IO event handlers
  useEffect(() => {
    const client = clientRef.current;

    const handleConnected = (data: any) => {
      setIsConnected(true);
      setTransport(data.transport || 'unknown');
      setError(null);
      
      // Join DSLR monitoring room when connected
      if (isRealTimeEnabled && !roomJoinedRef.current) {
        client.joinRoom('dslr-monitoring');
        roomJoinedRef.current = true;
        stopPolling(); // Stop polling when real-time is active
      }
    };

    const handleDisconnected = (data: any) => {
      setIsConnected(false);
      setError(data.reason || 'Disconnected');
      roomJoinedRef.current = false;
      
      // Start polling fallback when disconnected
      if (isRealTimeEnabled) {
        startPolling(30000); // 30 second fallback polling
      }
    };

    const handleDslrStatus = (data: any) => {
      setDslrStatus(data);
      setError(null);
      console.log('📡 DSLR status received via Socket.IO:', data);
    };

    const handleCameraStatus = (data: any) => {
      // Update DSLR status with camera info
      setDslrStatus((prev: any) => ({
        ...prev,
        cameraStatus: data.status,
        cameraModel: data.cameraModel,
        lastCameraUpdate: data.timestamp
      }));
    };

    const handleNotification = (notification: NotificationPayload) => {
      // Filter DSLR-related notifications
      if (['upload_success', 'upload_failed', 'camera_disconnected'].includes(notification.type)) {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      }
    };

    const handleRoomJoined = (data: any) => {
      if (data.room === 'dslr-monitoring') {
        console.log('📍 Joined DSLR monitoring room');
        roomJoinedRef.current = true;
        stopPolling(); // Stop polling when room joined
      }
    };

    const handleTransportUpgrade = (data: any) => {
      setTransport(data.transport);
    };

    // Register event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('dslr_status', handleDslrStatus);
    client.on('camera_status', handleCameraStatus);
    client.on('notification', handleNotification);
    client.on('room-joined', handleRoomJoined);
    client.on('transport-upgrade', handleTransportUpgrade);

    // Initial setup
    const currentStatus = client.getStatus();
    setIsConnected(currentStatus === 'connected');
    
    if (currentStatus === 'connected' && isRealTimeEnabled) {
      client.joinRoom('dslr-monitoring');
    } else if (isRealTimeEnabled) {
      startPolling(30000);
    }

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('dslr_status', handleDslrStatus);
      client.off('camera_status', handleCameraStatus);
      client.off('notification', handleNotification);
      client.off('room-joined', handleRoomJoined);
      client.off('transport-upgrade', handleTransportUpgrade);
      
      stopPolling();
      
      if (roomJoinedRef.current) {
        client.leaveRoom('dslr-monitoring');
        roomJoinedRef.current = false;
      }
    };
  }, [isRealTimeEnabled, startPolling, stopPolling]);

  // Handle real-time toggle
  const toggleRealTime = useCallback((enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    const client = clientRef.current;
    
    if (enabled) {
      if (client.getStatus() === 'connected') {
        client.joinRoom('dslr-monitoring');
        stopPolling();
      } else {
        startPolling(30000);
      }
    } else {
      if (roomJoinedRef.current) {
        client.leaveRoom('dslr-monitoring');
        roomJoinedRef.current = false;
      }
      stopPolling();
    }
  }, [startPolling, stopPolling]);

  // Manual refresh
  const refreshStatus = useCallback(() => {
    if (isConnected && roomJoinedRef.current) {
      // Request fresh data via Socket.IO
      clientRef.current.send('request-dslr-status', {});
    } else {
      // Use polling
      pollDslrStatus();
    }
  }, [isConnected, pollDslrStatus]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    dslrStatus,
    isConnected,
    transport,
    error,
    isRealTimeEnabled,
    notifications,
    toggleRealTime,
    refreshStatus,
    clearNotifications,
    connectionMode: isConnected && roomJoinedRef.current ? 'realtime' : 'polling',
    // Compatibility properties for WebSocket version
    cameraStatus: null,
    uploadProgress: null,
    subscribe: () => {},
    unsubscribe: () => {}
  };
}

// Backup monitoring hook dengan Socket.IO
export function useBackupRealtimeSocketIO() {
  const [backupStatus, setBackupStatus] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  
  const clientRef = useRef(getSocketIOClient());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomJoinedRef = useRef(false);

  // Polling fallback function
  const pollBackupStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/backup/status');
      if (response.ok) {
        const data = await response.json();
        setBackupStatus(data.backups || []);
        setError(null);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Backup polling error:', error);
      setError(error instanceof Error ? error.message : 'Polling failed');
    }
  }, []);

  // Start/stop polling
  const startPolling = useCallback((interval: number = 30000) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(pollBackupStatus, interval);
    console.log(`🔄 Backup polling started (${interval}ms interval)`);
  }, [pollBackupStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('⏹️ Backup polling stopped');
    }
  }, []);

  // Socket.IO event handlers
  useEffect(() => {
    const client = clientRef.current;

    const handleConnected = (data: any) => {
      setIsConnected(true);
      setTransport(data.transport || 'unknown');
      setError(null);
      
      // Join backup monitoring room when connected
      if (isRealTimeEnabled && !roomJoinedRef.current) {
        client.joinRoom('backup-status');
        roomJoinedRef.current = true;
        stopPolling(); // Stop polling when real-time is active
      }
    };

    const handleDisconnected = (data: any) => {
      setIsConnected(false);
      setError(data.reason || 'Disconnected');
      roomJoinedRef.current = false;
      
      // Start polling fallback when disconnected
      if (isRealTimeEnabled) {
        startPolling(30000); // 30 second fallback polling
      }
    };

    const handleBackupStatus = (data: any) => {
      if (Array.isArray(data)) {
        setBackupStatus(data);
      } else if (data.backups && Array.isArray(data.backups)) {
        setBackupStatus(data.backups);
      }
      setError(null);
      console.log('📡 Backup status received via Socket.IO:', data);
    };

    const handleNotification = (notification: NotificationPayload) => {
      // Filter backup-related notifications
      if (['system'].includes(notification.type) && 
          (notification.message.includes('backup') || notification.message.includes('Backup'))) {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      }
    };

    const handleRoomJoined = (data: any) => {
      if (data.room === 'backup-status') {
        console.log('📍 Joined backup monitoring room');
        roomJoinedRef.current = true;
        stopPolling(); // Stop polling when room joined
      }
    };

    const handleTransportUpgrade = (data: any) => {
      setTransport(data.transport);
    };

    // Register event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('backup_status', handleBackupStatus);
    client.on('notification', handleNotification);
    client.on('room-joined', handleRoomJoined);
    client.on('transport-upgrade', handleTransportUpgrade);

    // Initial setup
    const currentStatus = client.getStatus();
    setIsConnected(currentStatus === 'connected');
    
    if (currentStatus === 'connected' && isRealTimeEnabled) {
      client.joinRoom('backup-status');
    } else if (isRealTimeEnabled) {
      startPolling(30000);
    }

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('backup_status', handleBackupStatus);
      client.off('notification', handleNotification);
      client.off('room-joined', handleRoomJoined);
      client.off('transport-upgrade', handleTransportUpgrade);
      
      stopPolling();
      
      if (roomJoinedRef.current) {
        client.leaveRoom('backup-status');
        roomJoinedRef.current = false;
      }
    };
  }, [isRealTimeEnabled, startPolling, stopPolling]);

  // Handle real-time toggle
  const toggleRealTime = useCallback((enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    const client = clientRef.current;
    
    if (enabled) {
      if (client.getStatus() === 'connected') {
        client.joinRoom('backup-status');
        stopPolling();
      } else {
        startPolling(30000);
      }
    } else {
      if (roomJoinedRef.current) {
        client.leaveRoom('backup-status');
        roomJoinedRef.current = false;
      }
      stopPolling();
    }
  }, [startPolling, stopPolling]);

  // Manual refresh
  const refreshStatus = useCallback(() => {
    if (isConnected && roomJoinedRef.current) {
      // Request fresh data via Socket.IO
      clientRef.current.send('request-backup-status', {});
    } else {
      // Use polling
      pollBackupStatus();
    }
  }, [isConnected, pollBackupStatus]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    backupStatus,
    isConnected,
    transport,
    error,
    isRealTimeEnabled,
    notifications,
    toggleRealTime,
    refreshStatus,
    clearNotifications,
    connectionMode: isConnected && roomJoinedRef.current ? 'realtime' : 'polling'
  };
}

// System notifications hook
export function useSystemNotificationsSocketIO() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const clientRef = useRef(getSocketIOClient());
  const roomJoinedRef = useRef(false);

  useEffect(() => {
    const client = clientRef.current;

    const handleConnected = () => {
      setIsConnected(true);
      
      if (!roomJoinedRef.current) {
        client.joinRoom('admin-notifications');
        roomJoinedRef.current = true;
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      roomJoinedRef.current = false;
    };

    const handleNotification = (notification: NotificationPayload) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount(prev => prev + 1);
    };

    const handleRoomJoined = (data: any) => {
      if (data.room === 'admin-notifications') {
        console.log('📍 Joined admin notifications room');
        roomJoinedRef.current = true;
      }
    };

    // Register event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('notification', handleNotification);
    client.on('room-joined', handleRoomJoined);

    // Initial setup
    if (client.getStatus() === 'connected') {
      setIsConnected(true);
      client.joinRoom('admin-notifications');
    }

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('notification', handleNotification);
      client.off('room-joined', handleRoomJoined);
      
      if (roomJoinedRef.current) {
        client.leaveRoom('admin-notifications');
        roomJoinedRef.current = false;
      }
    };
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    clearNotifications
  };
}

// Upload progress hook
export function useUploadProgressSocketIO() {
  const [uploads, setUploads] = useState<Map<string, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  const clientRef = useRef(getSocketIOClient());
  const roomJoinedRef = useRef(false);

  useEffect(() => {
    const client = clientRef.current;

    const handleConnected = () => {
      setIsConnected(true);
      
      if (!roomJoinedRef.current) {
        client.joinRoom('upload-progress');
        roomJoinedRef.current = true;
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      roomJoinedRef.current = false;
    };

    const handleUploadProgress = (data: any) => {
      const { fileName, progress, total, status, uploadId } = data;
      
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.set(uploadId || fileName, {
          fileName,
          progress,
          total,
          status,
          timestamp: new Date().toISOString()
        });
        return newUploads;
      });

      // Remove completed uploads after 5 seconds
      if (status === 'completed' || status === 'failed') {
        setTimeout(() => {
          setUploads(prev => {
            const newUploads = new Map(prev);
            newUploads.delete(uploadId || fileName);
            return newUploads;
          });
        }, 5000);
      }
    };

    // Register event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('upload_progress', handleUploadProgress);

    // Initial setup
    if (client.getStatus() === 'connected') {
      setIsConnected(true);
      client.joinRoom('upload-progress');
    }

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('upload_progress', handleUploadProgress);
      
      if (roomJoinedRef.current) {
        client.leaveRoom('upload-progress');
        roomJoinedRef.current = false;
      }
    };
  }, []);

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    uploads: Array.from(uploads.values()),
    isConnected,
    clearUploads
  };
}