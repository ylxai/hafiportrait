/**
 * Socket.IO Server Setup with Redis Adapter
 * Handles real-time communication for likes, comments, and photo uploads
 * Supports horizontal scaling via Redis pub/sub
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

export type ServerToClientEvents = {
  'like:added': (data: { photoId: string; likesCount: number }) => void
  'like:removed': (data: { photoId: string; likesCount: number }) => void
  'comment:added': (data: { comment: any }) => void
  'guest:joined': (data: { guestCount: number }) => void
  'guest:left': (data: { guestCount: number }) => void
  'photo:upload:progress': (data: {
    photoId: string
    progress: number
    filename: string
  }) => void
  'photo:upload:complete': (data: { photo: any }) => void
}

export type ClientToServerEvents = {
  'event:join': (eventSlug: string) => void
  'event:leave': (eventSlug: string) => void
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null

/**
 * Initialize Socket.IO server with Redis adapter for production scaling
 */
export async function initSocketServer(
  httpServer: HTTPServer
): Promise<SocketIOServer> {
  if (io) {
    return io
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Performance optimizations
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      upgradeTimeout: 30000, // 30 seconds
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling'],
    }
  )

  // Setup Redis adapter for horizontal scaling (production only)
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    try {
      const redisUrl = process.env.REDIS_URL
      
      // Create two Redis clients for pub/sub
      const pubClient = createClient({ url: redisUrl })
      const subClient = pubClient.duplicate()

      // Error handling
      pubClient.on('error', (err) => {
        console.error('Socket.IO Redis Pub Client Error:', err)
      })
      subClient.on('error', (err) => {
        console.error('Socket.IO Redis Sub Client Error:', err)
      })

      // Connect clients
      await Promise.all([pubClient.connect(), subClient.connect()])

      // Create and set adapter
      io.adapter(createAdapter(pubClient, subClient))
    } catch (error) {
      console.error('Failed to initialize Redis adapter:', error)
      // Continue without Redis adapter (single server mode)
    }
  } else {
    console.log('Running in development mode - using memory adapter')
  }

  // Connection handling
  io.on('connection', (socket) => {
    // Join event room
    socket.on('event:join', (eventSlug: string) => {
      socket.join(`event:${eventSlug}`)
      // Broadcast guest count
      const room = io?.sockets.adapter.rooms.get(`event:${eventSlug}`)
      const guestCount = room?.size || 0
      io?.to(`event:${eventSlug}`).emit('guest:joined', { guestCount })
    })

    // Leave event room
    socket.on('event:leave', (eventSlug: string) => {
      socket.leave(`event:${eventSlug}`)
      // Broadcast guest count
      const room = io?.sockets.adapter.rooms.get(`event:${eventSlug}`)
      const guestCount = room?.size || 0
      io?.to(`event:${eventSlug}`).emit('guest:left', { guestCount })
    })

    // Disconnect
    socket.on('disconnect', () => {
    })
  })

  return io
}

/**
 * Get Socket.IO instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io
}

/**
 * Broadcast like added to event room
 */
export function broadcastLikeAdded(
  eventSlug: string,
  photoId: string,
  likesCount: number
) {
  if (!io) return
  io.to(`event:${eventSlug}`).emit('like:added', { photoId, likesCount })
}

/**
 * Broadcast like removed to event room
 */
export function broadcastLikeRemoved(
  eventSlug: string,
  photoId: string,
  likesCount: number
) {
  if (!io) return
  io.to(`event:${eventSlug}`).emit('like:removed', { photoId, likesCount })
}

/**
 * Broadcast comment added to event room
 */
export function broadcastCommentAdded(eventSlug: string, comment: any) {
  if (!io) return
  io.to(`event:${eventSlug}`).emit('comment:added', { comment })
}

/**
 * Broadcast photo upload progress
 */
export function broadcastPhotoUploadProgress(
  eventSlug: string,
  photoId: string,
  progress: number,
  filename: string
) {
  if (!io) return
  io.to(`event:${eventSlug}`).emit('photo:upload:progress', {
    photoId,
    progress,
    filename,
  })
}

/**
 * Broadcast photo upload complete
 */
export function broadcastPhotoUploadComplete(eventSlug: string, photo: any) {
  if (!io) return
  io.to(`event:${eventSlug}`).emit('photo:upload:complete', { photo })
}

/**
 * Get room size (number of connected clients)
 */
export function getRoomSize(roomName: string): number {
  if (!io) return 0
  const room = io.sockets.adapter.rooms.get(roomName)
  return room?.size || 0
}

/**
 * Get total connected clients
 */
export function getTotalConnections(): number {
  if (!io) return 0
  return io.sockets.sockets.size
}

/**
 * Graceful shutdown
 */
export async function shutdownSocketServer(): Promise<void> {
  if (io) {
    io.close()
    io = null
  }
}
