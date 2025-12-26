/**
 * Socket.IO Broadcasting Utilities
 * Server-side helpers untuk broadcasting real-time events
 */

import { io as ioClient, Socket } from 'socket.io-client';
import { signJWT } from '@/lib/auth';

// Singleton socket instance untuk server-side broadcasting
let serverSocket: Socket | null = null;
let broadcastToken: string | null = null;

async function getBroadcastToken(): Promise<string> {
  if (broadcastToken) return broadcastToken;

  // Internal system token for server-side broadcasting to Socket.IO
  // Socket server expects a valid JWT token.
  broadcastToken = await signJWT({
    user_id: 'system',
    username: 'system',
    role: 'ADMIN',
  });

  return broadcastToken;
}

/**
 * Initialize server-side socket connection untuk broadcasting
 */
export async function initServerSocket() {
  if (serverSocket?.connected) {
    return serverSocket;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  const token = await getBroadcastToken();

  serverSocket = ioClient(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    auth: { token },
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
export async function getServerSocket(): Promise<Socket | null> {
  if (!serverSocket || !serverSocket.connected) {
    return initServerSocket();
  }
  return serverSocket;
}

/**
 * Broadcast photo upload progress
 */
export async function broadcastPhotoUploadProgress(data: {
  eventSlug: string;
  photo_id: string;
  progress: number;
  filename: string;
}) {
  const socket = await getServerSocket();
  if (!socket) return;
  socket.emit('photo:upload:progress', data);
}

/**
 * Broadcast photo upload completion
 */
export async function broadcastPhotoUploadComplete(data: {
  eventSlug: string;
  photo: any;
}) {
  const socket = await getServerSocket();
  if (!socket) return;
  // Emit even if not yet connected: socket.io-client will buffer and send on connect.
  socket.emit('photo:upload:complete', data);
}

/**
 * Broadcast photo like update
 */
export async function broadcastPhotoLike(data: {
  eventSlug: string;
  photo_id: string;
  likeCount: number;
}) {
  const socket = await getServerSocket();
  if (!socket) return;
  socket.emit('photo:like', data);
}

/**
 * Broadcast new comment
 */
export async function broadcastPhotoComment(data: {
  eventSlug: string;
  photo_id: string;
  comment: any;
}) {
  const socket = await getServerSocket();
  if (!socket) return;
  socket.emit('photo:comment', data);
}

/**
 * Broadcast event update
 */
export async function broadcastEventUpdate(data: {
  eventSlug: string;
  updates: any;
}) {
  const socket = await getServerSocket();
  if (!socket) return;
  socket.emit('event:update', data);
}

/**
 * Broadcast admin notification
 */
export async function broadcastAdminNotification(data: {
  type: 'inquiry' | 'booking' | 'upload_complete' | 'system';
  data: any;
}) {
  const socket = await getServerSocket();
  if (!socket) return;
  socket.emit('admin:notification', data);
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
