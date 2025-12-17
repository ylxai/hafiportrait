'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { AdminErrorBoundary } from '@/components/error-boundaries'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const userData = await response.json()
          if (userData?.user?.role === 'ADMIN') {
            setUser(userData.user)
          } else {
            router.replace('/admin/login')
          }
        } else {
          // Only redirect if not on login page
          if (pathname !== '/admin/login') {
            router.replace('/admin/login')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (pathname !== '/admin/login') {
          router.replace('/admin/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Skip auth check if on login page
    if (pathname === '/admin/login') {
      setIsLoading(false)
      return
    }

    checkAuth()
  }, [router, pathname])

  // Show loading while checking auth (except on login page)
  if (isLoading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  // Login page doesn't need admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Protected pages need admin layout
  if (user) {
    return (
      <AdminErrorBoundary errorContext="Admin Layout">
        <AdminLayout>{children}</AdminLayout>
      </AdminErrorBoundary>
    )
  }

  return null
}
