'use client'

/**
 * Toast Provider Component
 * Wraps the app dengan Sonner Toaster
 * Provides centralized toast configuration
 */

import { Toaster } from 'sonner'
import { TOAST_CONFIG } from '@/lib/toast/toast-config'
import { useEffect, useState } from 'react'

export function ToastProvider() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Toaster
      position={isMobile ? TOAST_CONFIG.mobile.position : TOAST_CONFIG.position}
      theme={TOAST_CONFIG.theme}
      richColors={TOAST_CONFIG.richColors}
      closeButton={TOAST_CONFIG.closeButton}
      expand={TOAST_CONFIG.expand}
      visibleToasts={TOAST_CONFIG.visibleToasts}
      toastOptions={{
        classNames: {
          toast: 'group toast-custom',
          title: 'text-sm font-semibold',
          description: 'text-sm',
          actionButton: 'bg-brand-teal text-white hover:bg-brand-teal/90',
          cancelButton: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
          closeButton: 'bg-white border-gray-200 hover:bg-gray-100',
          error: 'border-red-200 bg-red-50',
          success: 'border-green-200 bg-green-50',
          warning: 'border-yellow-200 bg-yellow-50',
          info: 'border-blue-200 bg-blue-50',
        },
      }}
    />
  )
}
