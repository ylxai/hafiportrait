'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as Ably from 'ably'

export type AblyMessageHandler<T = unknown> = (payload: {
  name: string
  data: T
}) => void

/**
 * Minimal Ably channel hook.
 * - Uses token auth via `/api/realtime/auth?eventSlug=...`.
 * - Subscribes to `event:{eventSlug}` channel.
 */
export function useAblyChannel(eventSlug: string | null) {
  const channelRef = useRef<any>(null)

  const client = useMemo(() => {
    if (!eventSlug) return null

    // Build full URL for authUrl (Ably requires full URL, not relative path)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const authPath = process.env.NEXT_PUBLIC_ABLY_AUTH_URL || '/api/realtime/auth'
    const authUrl = `${baseUrl}${authPath}?eventSlug=${encodeURIComponent(eventSlug)}`

    return new Ably.Realtime({
      authUrl,
      authMethod: 'GET',
      autoConnect: true,
    })
  }, [eventSlug])

  useEffect(() => {
    if (!client || !eventSlug) return

    const channel = client.channels.get(`event:${eventSlug}`)
    channelRef.current = channel

    return () => {
      try {
        channel.unsubscribe()
        client.close()
      } catch {
        // ignore
      }
      channelRef.current = null
    }
  }, [client, eventSlug])

  const subscribe = (handler: AblyMessageHandler) => {
    const channel = channelRef.current
    if (!channel) return () => {}

    const wrapped = (msg: { name?: string; data?: unknown }) => {
      handler({ name: msg.name ?? '', data: msg.data as unknown })
    }

    channel.subscribe(wrapped)
    return () => channel.unsubscribe(wrapped)
  }

  return { subscribe }
}
