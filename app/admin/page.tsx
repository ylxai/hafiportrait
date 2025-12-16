'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRootPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const user = await response.json()
          if (user?.role === 'ADMIN') {
            // User already logged in as admin, redirect to dashboard
            router.replace('/admin/dashboard')
          } else {
            // User not admin, redirect to login
            router.replace('/admin/login')
          }
        } else {
          // User not logged in, redirect to login
          router.replace('/admin/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // On error, redirect to login
        router.replace('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show loading while determining redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  return null // Should not reach here due to redirects
}
