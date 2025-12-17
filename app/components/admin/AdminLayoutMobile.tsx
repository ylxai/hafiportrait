'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import BottomTabNavigation from './mobile/BottomTabNavigation'
import MobileHeader from './mobile/MobileHeader'
import QuickActionsFAB from './mobile/QuickActionsFAB'



interface AdminLayoutMobileProps {
  children: React.ReactNode
}

export default function AdminLayoutMobile({ children }: AdminLayoutMobileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [newMessagesCount, setNewMessagesCount] = useState(0)

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (!response.ok) {
        router.push('/admin/login')
        return
      }

    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
    fetchNotifications()
  }, [checkAuth])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/messages', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const unreadCount = data.messages?.filter((msg: any) => !msg.read)?.length || 0
        setNewMessagesCount(unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Determine if we should show the FAB
  const showFAB = !pathname.includes('/login') &&
                  !pathname.includes('/upload') &&
                  !pathname.includes('/create')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader
        notifications={newMessagesCount}
        showBack={pathname !== '/admin' && pathname !== '/admin/dashboard'}
      />

      {/* Main Content */}
      <main className="pb-4">
        {children}
      </main>

      {/* Quick Actions FAB */}
      {showFAB && <QuickActionsFAB />}

      {/* Bottom Navigation */}
      <BottomTabNavigation newMessagesCount={newMessagesCount} />
    </div>
  )
}