/**
 * Connection Status Component
 *
 * Displays network connection status with:
 * - Online/offline indicator
 * - Connection quality badge
 * - Reconnection status
 */

'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import {
  Wifi,
  WifiOff,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react'

export function ConnectionStatus() {
  const { isOnline, effectiveType, wasOffline, resetOfflineFlag } =
    useNetworkStatus()

  // Get connection icon based on quality
  const getConnectionIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />
    }

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return <SignalLow className="h-4 w-4" />
      case '3g':
        return <SignalMedium className="h-4 w-4" />
      case '4g':
        return <SignalHigh className="h-4 w-4" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  // Get connection quality text
  const getConnectionText = () => {
    if (!isOnline) {
      return 'Offline'
    }

    if (wasOffline) {
      return 'Reconnected'
    }

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'Slow connection'
      case '3g':
        return 'Moderate connection'
      case '4g':
        return 'Fast connection'
      default:
        return 'Online'
    }
  }

  // Get status color
  const getStatusColor = () => {
    if (!isOnline) {
      return 'bg-red-50 text-red-700 border-red-200'
    }

    if (wasOffline) {
      return 'bg-green-50 text-green-700 border-green-200'
    }

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case '3g':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case '4g':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  // Auto-dismiss reconnected message after 5 seconds
  if (wasOffline && isOnline) {
    setTimeout(() => {
      resetOfflineFlag()
    }, 5000)
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusColor()}`}
    >
      {getConnectionIcon()}
      <span>{getConnectionText()}</span>
    </div>
  )
}

/**
 * Connection Status Banner - Shows prominent message when offline
 */
export function ConnectionStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) {
    return null
  }

  return (
    <div
      className={`mb-4 rounded-lg border p-4 ${
        !isOnline
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-green-200 bg-green-50 text-green-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {!isOnline ? (
          <WifiOff className="mt-0.5 h-5 w-5 flex-shrink-0" />
        ) : (
          <Wifi className="mt-0.5 h-5 w-5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="mb-1 font-semibold">
            {!isOnline ? 'Koneksi Terputus' : 'Koneksi Pulih'}
          </h3>
          <p className="text-sm">
            {!isOnline
              ? 'Upload telah dijeda. Upload akan dilanjutkan otomatis ketika koneksi pulih.'
              : 'Koneksi internet telah pulih. Upload akan dilanjutkan secara otomatis.'}
          </p>
        </div>
      </div>
    </div>
  )
}
