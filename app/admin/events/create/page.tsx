'use client'

import { useRouter } from 'next/navigation'
import AdminLayout from '@/app/components/admin/AdminLayout'
import EventForm from '@/app/components/admin/EventForm'
import { useAdminToast } from '@/hooks/toast/useAdminToast'

interface EventFormData {
  name: string
  slug: string
  clientEmail: string
  clientPhone: string
  eventDate: string
  description: string
  location: string
  coupleName: string
  storageDurationDays: number
  autoGenerateAccessCode: boolean
}

export default function CreateEventPage() {
  const router = useRouter()
  const toast = useAdminToast()

  const handleSubmit = async (data: EventFormData) => {
    // Show loading toast
    const loadingToastId = toast.showLoading('Membuat event baru...')

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // Update loading toast to error
        toast.updateToast(loadingToastId, 'error', result.error || 'Gagal membuat event', {
          description: 'Silakan periksa data dan coba lagi'
        })
        return
      }

      // Update loading toast to success
      toast.updateToast(loadingToastId, 'success', `Event "${data.name}" berhasil dibuat!`, {
        description: 'Redirect ke halaman events...'
      })

      // Redirect to events list after short delay
      setTimeout(() => {
        router.push('/admin/events')
      }, 1500)
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.updateToast(loadingToastId, 'error', 'Terjadi kesalahan', {
        description: 'Periksa koneksi internet Anda'
      })
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Create New Event
          </h1>
          <p className="text-gray-600 mt-1">
            Set up a new wedding event gallery with unique access code
          </p>
        </div>

        {/* Form */}
        <EventForm onSubmit={handleSubmit} />
      </div>
    </AdminLayout>
  )
}
