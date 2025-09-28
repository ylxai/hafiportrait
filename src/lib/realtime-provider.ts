/**
 * Real-time Provider - Feature Flag System
 * Allows switching between WebSocket and Socket.IO implementations
 */

// WebSocket imports
import { 
  useWebSocketRealtime,
  useDSLRRealtime as useDSLRRealtimeWS,
  useBackupRealtime as useBackupRealtimeWS,
  useSystemNotifications as useSystemNotificationsWS
} from '@/hooks/use-websocket-realtime';

// Socket.IO imports
import {
  useSocketIORealtime,
  useDSLRRealtimeSocketIO,
  useBackupRealtimeSocketIO,
  useSystemNotificationsSocketIO,
  useUploadProgressSocketIO
} from '@/hooks/use-socketio-realtime';

// Feature flag detection
export const useSocketIO = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check environment variable
  const envFlag = process.env.NEXT_PUBLIC_USE_SOCKETIO === 'true';
  
  // Check localStorage override (for testing)
  const localStorageFlag = localStorage.getItem('use-socketio') === 'true';
  
  // Check URL parameter override (for testing)
  const urlParams = typeof window !== 'undefined' 
    ? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams())
    : new URLSearchParams();
  const urlFlag = urlParams.get('socketio') === 'true';
  
  return urlFlag || localStorageFlag || envFlag;
};

// Generic real-time hook with automatic provider selection
export function useRealtime() {
  const shouldUseSocketIO = useSocketIO();
  
  if (shouldUseSocketIO) {
    return {
      ...useSocketIORealtime(),
      provider: 'socket.io' as const
    };
  } else {
    return {
      ...useWebSocketRealtime(),
      provider: 'websocket' as const
    };
  }
}

// DSLR monitoring hook with automatic provider selection
export function useDSLRRealtime() {
  const shouldUseSocketIO = useSocketIO();
  
  if (shouldUseSocketIO) {
    return {
      ...useDSLRRealtimeSocketIO(),
      provider: 'socket.io' as const
    };
  } else {
    return {
      ...useDSLRRealtimeWS(),
      provider: 'websocket' as const
    };
  }
}

// Backup monitoring hook with automatic provider selection
export function useBackupRealtime() {
  const shouldUseSocketIO = useSocketIO();
  
  if (shouldUseSocketIO) {
    return {
      ...useBackupRealtimeSocketIO(),
      provider: 'socket.io' as const
    };
  } else {
    return {
      ...useBackupRealtimeWS(),
      provider: 'websocket' as const
    };
  }
}

// System notifications hook with automatic provider selection
export function useSystemNotifications() {
  const shouldUseSocketIO = useSocketIO();
  
  if (shouldUseSocketIO) {
    return {
      ...useSystemNotificationsSocketIO(),
      provider: 'socket.io' as const
    };
  } else {
    return {
      ...useSystemNotificationsWS(),
      provider: 'websocket' as const
    };
  }
}

// Upload progress hook (Socket.IO only feature)
export function useUploadProgress() {
  const shouldUseSocketIO = useSocketIO();
  
  if (shouldUseSocketIO) {
    return {
      ...useUploadProgressSocketIO(),
      provider: 'socket.io' as const
    };
  } else {
    // Fallback for WebSocket (no upload progress support)
    return {
      uploads: [],
      isConnected: false,
      clearUploads: () => {},
      provider: 'websocket' as const
    };
  }
}

// Provider info hook
export function useRealtimeProvider() {
  const shouldUseSocketIO = useSocketIO();
  
  return {
    provider: shouldUseSocketIO ? 'socket.io' : 'websocket',
    isSocketIO: shouldUseSocketIO,
    isWebSocket: !shouldUseSocketIO,
    features: {
      rooms: shouldUseSocketIO,
      compression: shouldUseSocketIO,
      autoFallback: shouldUseSocketIO,
      uploadProgress: shouldUseSocketIO,
      mobileOptimized: shouldUseSocketIO,
      rateLimiting: shouldUseSocketIO
    }
  };
}

// Provider switching utilities (for testing)
export const realtimeUtils = {
  // Switch to Socket.IO
  enableSocketIO: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('use-socketio', 'true');
      if (typeof window !== 'undefined') window.location.reload();
    }
  },
  
  // Switch to WebSocket
  enableWebSocket: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('use-socketio', 'false');
      if (typeof window !== 'undefined') window.location.reload();
    }
  },
  
  // Clear override (use environment default)
  clearOverride: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('use-socketio');
      if (typeof window !== 'undefined') window.location.reload();
    }
  },
  
  // Get current provider info
  getProviderInfo: () => {
    const envFlag = process.env.NEXT_PUBLIC_USE_SOCKETIO === 'true';
    const localStorageFlag = typeof window !== 'undefined' ? 
      localStorage.getItem('use-socketio') === 'true' : false;
    
    return {
      environment: envFlag ? 'socket.io' : 'websocket',
      override: typeof window !== 'undefined' ? 
        localStorage.getItem('use-socketio') : null,
      current: localStorageFlag || envFlag ? 'socket.io' : 'websocket'
    };
  }
};