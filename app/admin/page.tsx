'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRootPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to dashboard
    // Auth will be checked by layout
    router.replace('/admin/dashboard')
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-600 font-medium">Loading Admin Panel...</p>
      </div>
    </div>
  )
}
