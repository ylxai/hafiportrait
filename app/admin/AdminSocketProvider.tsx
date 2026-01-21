'use client'

import { useSocket } from '@/hooks/useSocket'

/**
 * Establishes an admin-authenticated Socket.IO connection for realtime admin notifications.
 * Minimal implementation: connect + join admin room.
 */
export default function AdminSocketProvider() {
  useSocket({ admin: true, autoConnect: true })
  return null
}
