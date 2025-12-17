/**
 * Socket.IO Broadcasting Utilities
 * Server-side helpers untuk broadcasting real-time events
 */

import { io as ioClient, Socket } from 'socket.io-client';

// Singleton socket instance untuk server-side broadcasting
let serverSocket: Socket | null = null;

/**
 * Initialize server-side socket connection untuk broadcasting
 */
export function initServerSocket() {
  if (serverSocket?.connected) {
    return serverSocket;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  
  serverSocket = ioClient(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  serverSocket.on('connect', () => {
  });

  serverSocket.on('disconnect', () => {
  });

  serverSocket.on('connect_error', (err) => {
    console.error('Server socket connection error:', err.message);
  });

  return serverSocket;
}

/**
 * Get or create server socket instance
 */
export function getServerSocket(): Socket | null {
  if (!serverSocket || !serverSocket.connected) {
    return initServerSocket();
  }
  return serverSocket;
}

/**
 * Broadcast photo upload progress
 */
export function broadcastPhotoUploadProgress(data: {
  eventSlug: string;
  photo_id: string;
  progress: number;
  filename: string;
}) {
  const socket = getServerSocket();
  if (socket?.connected) {
    socket.emit('photo:upload:progress', data);
  }
}

/**
 * Broadcast photo upload completion
 */
export function broadcastPhotoUploadComplete(data: {
  eventSlug: string;
  photo: any;
}) {
  const socket = getServerSocket();
  if (socket?.connected) {
    socket.emit('photo:upload:complete', data);
  }
}

/**
 * Broadcast photo like update
 */
export function broadcastPhotoLike(data: {
  eventSlug: string;
  photo_id: string;
  likeCount: number;
}) {
  const socket = getServerSocket();
  if (socket?.connected) {
    socket.emit('photo:like', data);
  }
}

/**
 * Broadcast new comment
 */
export function broadcastPhotoComment(data: {
  eventSlug: string;
  photo_id: string;
  comment: any;
}) {
  const socket = getServerSocket();
  if (socket?.connected) {
    socket.emit('photo:comment', data);
  }
}

/**
 * Broadcast event update
 */
export function broadcastEventUpdate(data: {
  eventSlug: string;
  updates: any;
}) {
  const socket = getServerSocket();
  if (socket?.connected) {
    socket.emit('event:update', data);
  }
}

/**
 * Broadcast admin notification
 */
export function broadcastAdminNotification(data: {
  type: 'inquiry' | 'booking' | 'upload_complete' | 'system';
  data: any;
}) {
  const socket = getServerSocket();
  if (socket?.connected) {
    socket.emit('admin:notification', data);
  }
}

/**
 * Close server socket connection
 */
export function closeServerSocket() {
  if (serverSocket) {
    serverSocket.disconnect();
    serverSocket = null;
  }
}
