/**
 * useSocket Hook (ENHANCED - Memory Leak Fixed)
 * Manages Socket.IO connection for real-time updates
 * 
 * FIXES:
 * - Proper cleanup on unmount
 * - Prevents memory leaks
 * - Handles stale closures
 * - Proper dependency management
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  eventSlug?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
}

interface PhotoUploadProgress {
  photo_id: string;
  progress: number;
  filename: string;
  timestamp: string;
}

interface PhotoUploadComplete {
  photo: any;
  timestamp: string;
}

interface PhotoLike {
  photo_id: string;
  likeCount: number;
  timestamp: string;
}

interface PhotoComment {
  photo_id: string;
  comment: any;
  timestamp: string;
}

interface EventUpdate {
  updates: any;
  timestamp: string;
}

interface AdminNotification {
  type: string;
  data: any;
  timestamp: string;
}

export function useSocket({ 
  eventSlug, 
  autoConnect = true,
  reconnectionAttempts = 5 
}: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  // Determine Socket.IO server URL based on environment
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://socketio.hafiportrait.photography'
      : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

  useEffect(() => {
    // Mark as mounted
    mountedRef.current = true;

    if (!autoConnect) return undefined;

    try {
      // Initialize socket connection
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts,
        timeout: 20000,
        autoConnect: true,
      });

      socketRef.current = socket;

      // Connection handlers (check if still mounted before state updates)
      socket.on('connect', () => {
        if (mountedRef.current) {
          setIsConnected(true);
          setError(null);
        }
        
        // Auto-join event room if eventSlug provided
        if (eventSlug) {
          socket.emit('event:join', eventSlug);
        }
      });

      socket.on('disconnect', (reason) => {
        if (mountedRef.current) {
          setIsConnected(false);
        }
        
        if (reason === 'io server disconnect') {
          // Server disconnected, manually reconnect
          socket.connect();
        }
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        if (mountedRef.current) {
          setError(`Connection error: ${err.message}`);
          setIsConnected(false);
        }
      });

      socket.on('reconnect', () => {
        if (mountedRef.current) {
          setError(null);
        }
      });

      socket.on('reconnect_failed', () => {
        console.error('✗ Socket reconnection failed');
        if (mountedRef.current) {
          setError('Failed to reconnect to server');
        }
      });

      // Guest count handlers
      socket.on('guest:joined', ({ guestCount: count }) => {
        if (mountedRef.current) {
          setGuestCount(count);
        }
      });

      socket.on('guest:left', ({ guestCount: count }) => {
        if (mountedRef.current) {
          setGuestCount(count);
        }
      });

      // Cleanup function - CRITICAL for preventing memory leaks
      return () => {
        mountedRef.current = false;
        
        // Leave event room if joined
        if (eventSlug && socket.connected) {
          socket.emit('event:leave', eventSlug);
        }
        
        // Remove all listeners
        socket.removeAllListeners();
        
        // Disconnect socket
        socket.disconnect();
        
        // Clear reference
        socketRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize socket:', err);
      if (mountedRef.current) {
        setError('Failed to initialize socket connection');
      }
      return undefined;
    }
  }, [eventSlug, autoConnect, reconnectionAttempts, SOCKET_URL]);

  // Helper methods with useCallback to prevent unnecessary re-renders
  const joinEvent = useCallback((slug: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('event:join', slug);
    }
  }, []);

  const leaveEvent = useCallback((slug: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('event:leave', slug);
    }
  }, []);

  const joinAdmin = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admin:join');
    }
  }, []);

  // Event listener registration with cleanup
  const onPhotoUploadProgress = useCallback((callback: (data: PhotoUploadProgress) => void) => {
    const handler = (data: PhotoUploadProgress) => {
      if (mountedRef.current) callback(data);
    };
    socketRef.current?.on('photo:upload:progress', handler);
    return () => {
      socketRef.current?.off('photo:upload:progress', handler);
    };
  }, []);

  const onPhotoUploadComplete = useCallback((callback: (data: PhotoUploadComplete) => void) => {
    const handler = (data: PhotoUploadComplete) => {
      if (mountedRef.current) callback(data);
    };
    socketRef.current?.on('photo:upload:complete', handler);
    return () => {
      socketRef.current?.off('photo:upload:complete', handler);
    };
  }, []);

  const onPhotoLike = useCallback((callback: (data: PhotoLike) => void) => {
    const handler = (data: PhotoLike) => {
      if (mountedRef.current) callback(data);
    };
    socketRef.current?.on('photo:like', handler);
    return () => {
      socketRef.current?.off('photo:like', handler);
    };
  }, []);

  const onPhotoComment = useCallback((callback: (data: PhotoComment) => void) => {
    const handler = (data: PhotoComment) => {
      if (mountedRef.current) callback(data);
    };
    socketRef.current?.on('photo:comment', handler);
    return () => {
      socketRef.current?.off('photo:comment', handler);
    };
  }, []);

  const onEventUpdate = useCallback((callback: (data: EventUpdate) => void) => {
    const handler = (data: EventUpdate) => {
      if (mountedRef.current) callback(data);
    };
    socketRef.current?.on('event:update', handler);
    return () => {
      socketRef.current?.off('event:update', handler);
    };
  }, []);

  const onAdminNotification = useCallback((callback: (data: AdminNotification) => void) => {
    const handler = (data: AdminNotification) => {
      if (mountedRef.current) callback(data);
    };
    socketRef.current?.on('admin:notification', handler);
    return () => {
      socketRef.current?.off('admin:notification', handler);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    guestCount,
    error,
    // Connection methods
    joinEvent,
    leaveEvent,
    joinAdmin,
    // Listener methods (return cleanup functions)
    onPhotoUploadProgress,
    onPhotoUploadComplete,
    onPhotoLike,
    onPhotoComment,
    onEventUpdate,
    onAdminNotification,
  };
}
