/**
 * Updated for Zeabur Socket.IO deployment
 * Migration date: 2025-08-14T19:08:26.827Z
 * Zeabur URL: https://wbs.zeabur.app
 */

/**
 * Production WebSocket Configuration
 * Optimized settings for external WebSocket server
 */

export const PRODUCTION_WS_CONFIG = {
  // External WebSocket Server
  serverUrl: 'https://wbs.zeabur.app',
  healthEndpoint: 'https://wbs.zeabur.app/health',
  wsEndpoint: 'https://wbs.zeabur.app/socket.io/',
  
  // Connection Settings
  connectionTimeout: 10000,
  reconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  
  // Health Check Settings
  healthCheckInterval: 30000,
  healthCheckTimeout: 5000,
  
  // Fallback Polling Configuration
  fallbackPolling: {
    'backup-status-monitor': {
      activeInterval: 3000,
      idleInterval: 10000,
      priority: 'high'
    },
    'dslr-monitor': {
      activeInterval: 5000,
      idleInterval: 15000,
      priority: 'high'
    },
    'system-monitor': {
      activeInterval: 15000,
      idleInterval: 45000,
      priority: 'medium'
    },
    'event-backup-manager': {
      activeInterval: 1500,
      idleInterval: 10000,
      priority: 'high'
    }
  },
  
  // Transport Preferences
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  
  // Mobile Optimizations
  mobile: {
    backgroundPollingInterval: 60000,
    foregroundPollingInterval: 30000,
    networkAdaptive: true
  },
  
  // Performance Settings
  performance: {
    enableCompression: true,
    enableBinarySupport: true,
    maxPayloadSize: 1048576, // 1MB
    heartbeatInterval: 30000
  }
};

// Environment Detection
export function getWebSocketConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    return {
      ...PRODUCTION_WS_CONFIG,
      serverUrl: process.env.NEXT_PUBLIC_SOCKETIO_URL || 'http://147.251.255.227:3001',
      healthCheckInterval: 60000, // Less frequent in dev
      fallbackPolling: {
        ...PRODUCTION_WS_CONFIG.fallbackPolling,
        // Slower polling in development
        'backup-status-monitor': { activeInterval: 5000, idleInterval: 15000 },
        'dslr-monitor': { activeInterval: 10000, idleInterval: 30000 },
        'system-monitor': { activeInterval: 30000, idleInterval: 60000 }
      }
    };
  }
  
  return PRODUCTION_WS_CONFIG;
}

// Connection Quality Detection
export function detectConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
  if (typeof navigator === 'undefined') return 'good';
  
  if (!navigator.onLine) return 'offline';
  
  const connection = (navigator as any).connection;
  if (!connection) return 'good';
  
  const { effectiveType, downlink, rtt } = connection;
  
  if (effectiveType === '4g' && downlink > 10 && rtt < 100) return 'excellent';
  if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1)) return 'good';
  return 'poor';
}

// Adaptive Configuration Based on Connection
export function getAdaptiveConfig() {
  const quality = detectConnectionQuality();
  const baseConfig = getWebSocketConfig();
  
  switch (quality) {
    case 'excellent':
      return {
        ...baseConfig,
        connectionTimeout: 5000,
        healthCheckInterval: 15000,
        fallbackPolling: Object.fromEntries(
          Object.entries(baseConfig.fallbackPolling).map(([key, config]) => [
            key,
            { ...config, activeInterval: config.activeInterval * 0.8 }
          ])
        )
      };
      
    case 'poor':
      return {
        ...baseConfig,
        connectionTimeout: 20000,
        healthCheckInterval: 60000,
        transports: ['polling'], // Force polling for poor connections
        fallbackPolling: Object.fromEntries(
          Object.entries(baseConfig.fallbackPolling).map(([key, config]) => [
            key,
            { ...config, activeInterval: config.activeInterval * 1.5 }
          ])
        )
      };
      
    case 'offline':
      return {
        ...baseConfig,
        serverUrl: null, // Disable WebSocket
        fallbackPolling: Object.fromEntries(
          Object.entries(baseConfig.fallbackPolling).map(([key, config]) => [
            key,
            { ...config, activeInterval: config.activeInterval * 2 }
          ])
        )
      };
      
    default:
      return baseConfig;
  }
}