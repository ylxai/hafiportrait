/**
 * Socket.IO Broadcasting Utilities
 * Server-side helpers untuk broadcasting real-time events
 */

import { publishToEventChannel } from '@/lib/realtime/ably'

/**
 * Broadcast photo upload progress
 */
export async function broadcastPhotoUploadProgress(data: {
  eventSlug: string
  photo_id: string
  progress: number
  filename: string
}) {
  await publishToEventChannel(data.eventSlug, 'photo:upload:progress', data)
}

/**
 * Broadcast photo upload completion
 */
export async function broadcastPhotoUploadComplete(data: {
  eventSlug: string
  photo: any
}) {
  await publishToEventChannel(data.eventSlug, 'photo:upload:complete', data)
}

/**
 * Broadcast photo like update
 */
export async function broadcastPhotoLike(data: {
  eventSlug: string
  photo_id: string
  likeCount: number
}) {
  await publishToEventChannel(data.eventSlug, 'like:added', data)
}

/**
 * Broadcast new comment
 */
export async function broadcastPhotoComment(data: {
  eventSlug: string
  photo_id: string
  comment: any
}) {
  await publishToEventChannel(data.eventSlug, 'comment:added', data)
}

/**
 * Broadcast event update
 */
export async function broadcastEventUpdate(data: {
  eventSlug: string
  updates: any
}) {
  await publishToEventChannel(data.eventSlug, 'event:update', data)
}

/**
 * Broadcast admin notification (no-op in Ably for now)
 */
export async function broadcastAdminNotification(_data: {
  type: 'inquiry' | 'booking' | 'upload_complete' | 'system'
  data: any
}) {
  // TODO: implement admin channel if needed
}

export function closeServerSocket() {
  return
}
