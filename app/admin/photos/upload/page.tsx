'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to photos page where user can select event to upload
    router.replace('/admin/photos')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to photos...</p>
      </div>
    </div>
  )
}
