/**
 * Network Status Hook
 *
 * Monitors network connectivity and provides:
 * - Online/offline status
 * - Connection quality detection
 * - Automatic pause/resume of uploads
 */

'use client'

import { useEffect, useState, useCallback } from 'react'

export interface NetworkStatus {
  isOnline: boolean
  wasOffline: boolean
  downlink?: number // Mbps
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  rtt?: number // Round-trip time in ms
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  })

  const updateNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    setStatus((prev) => ({
      isOnline: navigator.onLine,
      wasOffline: prev.wasOffline || (!navigator.onLine && prev.isOnline),
      downlink: connection?.downlink,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
    }))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
      }))
    }

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
      }))
    }

    // Listen to online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen to connection changes (if supported)
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo)
    }

    // Initial update
    updateNetworkInfo()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [updateNetworkInfo])

  const resetOfflineFlag = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      wasOffline: false,
    }))
  }, [])

  return {
    ...status,
    resetOfflineFlag,
  }
}
