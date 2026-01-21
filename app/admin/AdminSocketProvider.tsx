'use client'

import { useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAdminToast } from '@/hooks/toast/useAdminToast'

type AdminNotificationPayload = {
  type: 'upload_complete' | string
  data?: {
    eventSlug?: string
    filename?: string
    photo_id?: string
    [k: string]: unknown
  }
  timestamp?: string
}

/**
 * Establishes an admin-authenticated Socket.IO connection for realtime admin notifications.
 * Minimal implementation: connect + join admin room + show toast notifications.
 */
export default function AdminSocketProvider() {
  const toast = useAdminToast()
  const { onAdminNotification } = useSocket({ admin: true, autoConnect: true })

  useEffect(() => {
    return onAdminNotification((payload: AdminNotificationPayload) => {
      if (!payload) return

      if (payload.type === 'upload_complete') {
        const eventSlug = payload.data?.eventSlug || 'event'
        const filename = payload.data?.filename

        toast.updateToast(
          `admin-upload-complete-${payload.data?.photo_id ?? ''}`,
          'success',
          'Upload selesai',
          {
            description: filename
              ? `[${eventSlug}] ${filename}`
              : `[${eventSlug}] Foto baru berhasil diupload`,
            duration: 4000,
          }
        )
        return
      }

      // Generic fallback
      toast.updateToast('admin-notification', 'info', 'Notifikasi', {
        description: payload.type,
        duration: 3000,
      })
    })
  }, [onAdminNotification, toast])

  return null
}
