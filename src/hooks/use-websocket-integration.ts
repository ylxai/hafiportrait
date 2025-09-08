/**
 * Enhanced WebSocket Integration Hook
 * Combines external WebSocket with intelligent polling fallback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocketIOClient } from '@/lib/socketio-client';
import { adaptivePollingManager } from '@/lib/enhanced-polling-config';

interface WebSocketIntegrationOptions {
  componentId: string;
  fallbackCallback: () => Promise<void> | void;
  channels?: string[];
  pollingConfig?: {
    activeInterval?: number;
    idleInterval?: number;
    priority?: 'high' | 'medium' | 'low';
  };
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  transport: string | null;
  error: string | null;
  lastMessage: any;
  usingFallback: boolean;
  pollingActive: boolean;
}

export function useWebSocketIntegration(options: WebSocketIntegrationOptions) {
  const {
    componentId,
    fallbackCallback,
    channels = [],
    pollingConfig = {}
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    transport: null,
    error: null,
    lastMessage: null,
    usingFallback: false,
    pollingActive: false
  });

  const socketClient = useRef(getSocketIOClient());
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Health check for external WebSocket
  const checkWebSocketHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://xcyrexmwrwjq.ap-southeast-1.clawcloudrun.com/health', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`WebSocket health check failed: ${message}`);
      return false;
    }
  }, []);

  // Start fallback polling
  const startFallbackPolling = useCallback(() => {
    if (state.pollingActive) return;

    console.log(`📊 Starting fallback polling for ${componentId}`);
    
    setState(prev => ({ 
      ...prev, 
      usingFallback: true, 
      pollingActive: true 
    }));

    // Use enhanced adaptive polling
    adaptivePollingManager.startPolling(
      componentId,
      fallbackCallback,
      {
        interval: pollingConfig.activeInterval || 5000,
        priority: pollingConfig.priority || 'medium',
        adaptiveScaling: true,
        maxInterval: pollingConfig.idleInterval || 30000,
        minInterval: pollingConfig.activeInterval || 2000
      }
    );
  }, [componentId, fallbackCallback, pollingConfig, state.pollingActive]);

  // Stop fallback polling
  const stopFallbackPolling = useCallback(() => {
    if (!state.pollingActive) return;

    console.log(`⏹️ Stopping fallback polling for ${componentId}`);
    
    adaptivePollingManager.stopPolling(componentId);
    
    setState(prev => ({ 
      ...prev, 
      usingFallback: false, 
      pollingActive: false 
    }));
  }, [componentId, state.pollingActive]);

  // Handle WebSocket connection
  const handleWebSocketConnection = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      transport: socketClient.current.getConnectionInfo()?.transport || 'unknown',
      error: null
    }));

    // Stop fallback polling when WebSocket connects
    stopFallbackPolling();

    // Subscribe to channels
    channels.forEach(channel => {
      socketClient.current.joinRoom(channel);
    });

    console.log(`✅ WebSocket connected for ${componentId}, fallback disabled`);
  }, [componentId, channels, stopFallbackPolling]);

  // Handle WebSocket disconnection
  const handleWebSocketDisconnection = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      transport: null,
      error: data.reason || 'Connection lost'
    }));

    // Start fallback polling immediately
    startFallbackPolling();

    console.log(`🔌 WebSocket disconnected for ${componentId}, fallback activated`);
  }, [componentId, startFallbackPolling]);

  // Handle WebSocket error
  const handleWebSocketError = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      error: data.error?.message || 'WebSocket error',
      isConnecting: false
    }));

    // Start fallback if not already active
    if (!state.usingFallback) {
      startFallbackPolling();
    }
  }, [startFallbackPolling, state.usingFallback]);

  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      lastMessage: {
        type: 'websocket',
        payload: data,
        timestamp: new Date().toISOString()
      }
    }));
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    const client = socketClient.current;

    // Connection events
    client.on('connected', handleWebSocketConnection);
    client.on('disconnected', handleWebSocketDisconnection);
    client.on('connect_error', handleWebSocketError);
    client.on('error', handleWebSocketError);

    // Message events for all channels
    channels.forEach(channel => {
      client.on(channel, handleMessage);
    });

    // Cleanup
    return () => {
      client.off('connected', handleWebSocketConnection);
      client.off('disconnected', handleWebSocketDisconnection);
      client.off('connect_error', handleWebSocketError);
      client.off('error', handleWebSocketError);
      
      channels.forEach(channel => {
        client.off(channel, handleMessage);
      });
    };
  }, [channels, handleWebSocketConnection, handleWebSocketDisconnection, handleWebSocketError, handleMessage]);

  // Initial connection attempt and health monitoring
  useEffect(() => {
    let mounted = true;

    // Initial health check
    const initializeConnection = async () => {
      setState(prev => ({ ...prev, isConnecting: true }));

      const isHealthy = await checkWebSocketHealth();
      
      if (!mounted) return;

      if (isHealthy) {
        // WebSocket server is healthy, try to connect
        console.log(`🔗 WebSocket server healthy, attempting connection for ${componentId}`);
        
        // Set fallback timeout in case connection fails
        fallbackTimeoutRef.current = setTimeout(() => {
          if (!state.isConnected && mounted) {
            console.log(`⏰ WebSocket connection timeout for ${componentId}, starting fallback`);
            startFallbackPolling();
          }
        }, 10000); // 10 second timeout
        
      } else {
        // WebSocket server not healthy, start fallback immediately
        console.log(`❌ WebSocket server unhealthy for ${componentId}, using fallback`);
        setState(prev => ({ ...prev, isConnecting: false }));
        startFallbackPolling();
      }
    };

    initializeConnection();

    // Periodic health checks
    healthCheckIntervalRef.current = setInterval(async () => {
      if (!mounted) return;

      const isHealthy = await checkWebSocketHealth();
      
      if (!isHealthy && state.isConnected) {
        console.log(`⚠️ WebSocket health check failed for ${componentId}`);
        // WebSocket will handle disconnection automatically
      } else if (isHealthy && !state.isConnected && state.usingFallback) {
        console.log(`✅ WebSocket server recovered for ${componentId}, attempting reconnection`);
        socketClient.current.reconnect();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      mounted = false;
      
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      
      stopFallbackPolling();
    };
  }, [componentId, checkWebSocketHealth, startFallbackPolling, stopFallbackPolling]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    socketClient.current.reconnect();
  }, []);

  // Send message
  const sendMessage = useCallback((type: string, payload: any, room?: string) => {
    if (state.isConnected) {
      socketClient.current.send(type, payload, room);
    } else {
      console.warn(`Cannot send message via WebSocket for ${componentId}: not connected, using fallback`);
      // Trigger fallback callback to refresh data
      fallbackCallback();
    }
  }, [state.isConnected, componentId, fallbackCallback]);

  // Adjust polling activity level
  const adjustPollingActivity = useCallback((level: 'idle' | 'active' | 'critical') => {
    if (state.usingFallback) {
      adaptivePollingManager.adjustPollingInterval(componentId, level);
    }
  }, [componentId, state.usingFallback]);

  return {
    // Connection state
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    transport: state.transport,
    error: state.error,
    lastMessage: state.lastMessage,
    usingFallback: state.usingFallback,
    pollingActive: state.pollingActive,
    
    // Actions
    sendMessage,
    reconnect,
    adjustPollingActivity,
    
    // Status
    getConnectionInfo: () => ({
      ...state,
      serverUrl: 'https://xcyrexmwrwjq.ap-southeast-1.clawcloudrun.com',
      healthUrl: 'https://xcyrexmwrwjq.ap-southeast-1.clawcloudrun.com/health',
      pollingStatus: adaptivePollingManager.getPollingStatus()[componentId]
    })
  };
}

// Specialized hooks for different components
export function useBackupWebSocketIntegration() {
  const [backupData, setBackupData] = useState(null);

  const fallbackCallback = async () => {
    try {
      const response = await fetch('/api/admin/backup/status');
      const result = await response.json();
      if (result.success) {
        setBackupData(result.data);
      }
    } catch (error) {
      console.error('Backup fallback failed:', error);
    }
  };

  const integration = useWebSocketIntegration({
    componentId: 'backup-status-monitor',
    fallbackCallback,
    channels: ['backup', 'backup_status', 'backup_progress'],
    pollingConfig: {
      activeInterval: 3000,
      idleInterval: 10000,
      priority: 'high'
    }
  });

  return {
    ...integration,
    backupData
  };
}

export function useDSLRWebSocketIntegration() {
  const [dslrData, setDslrData] = useState(null);

  const fallbackCallback = async () => {
    try {
      const response = await fetch('/api/dslr/status');
      const result = await response.json();
      if (result.success) {
        setDslrData(result);
      }
    } catch (error) {
      console.error('DSLR fallback failed:', error);
    }
  };

  const integration = useWebSocketIntegration({
    componentId: 'dslr-monitor',
    fallbackCallback,
    channels: ['dslr', 'dslr_status', 'camera_status', 'upload_progress'],
    pollingConfig: {
      activeInterval: 5000,
      idleInterval: 15000,
      priority: 'high'
    }
  });

  return {
    ...integration,
    dslrData
  };
}

interface SystemMetrics {
  dslr: any;
  database: any;
  timestamp: string;
}

export function useSystemWebSocketIntegration() {
  const [systemData, setSystemData] = useState<SystemMetrics | null>(null);

  const fallbackCallback = async () => {
    try {
      // Fetch system metrics from multiple endpoints
      const [dslrResponse, dbResponse] = await Promise.all([
        fetch('/api/dslr/status'),
        fetch('/api/test/db')
      ]);

      const systemMetrics = {
        dslr: dslrResponse.ok ? await dslrResponse.json() : null,
        database: dbResponse.ok ? await dbResponse.json() : null,
        timestamp: new Date().toISOString()
      };

      setSystemData(systemMetrics);
    } catch (error) {
      console.error('System fallback failed:', error);
    }
  };

  const integration = useWebSocketIntegration({
    componentId: 'system-monitor',
    fallbackCallback,
    channels: ['system', 'system_status'],
    pollingConfig: {
      activeInterval: 15000,
      idleInterval: 45000,
      priority: 'medium'
    }
  });

  return {
    ...integration,
    systemData
  };
}