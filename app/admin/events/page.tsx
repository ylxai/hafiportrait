'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import MobileEventsPage from '@/app/components/admin/mobile/MobileEventsPage'
import Link from 'next/link'
import { 
  CalendarIcon as Calendar, 
  PlusIcon as Plus, 
  MagnifyingGlassIcon as Search, 
  FunnelIcon as Filter, 
  EyeIcon as Eye, 
  CameraIcon as Camera, 
  TrashIcon as Trash2 
} from '@heroicons/react/24/outline'
import { useAdminToast } from '@/hooks/toast/useAdminToast'
import ErrorAlert from '@/components/ui/ErrorAlert'

interface Event {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  event_date: string | null
  created_at: string
  _count: {
    photos: number
  }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useAdminToast()

  const fetchEvents = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/events', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch events (${response.status})`)
      }

      const data = await response.json()
      setEvents(data.events || [])
      setLoading(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch events'
      setError(message)
      console.error('Error fetching events:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const deleteEvent = async (event_id: string, eventName: string, photoCount: number) => {
    if (!confirm(`Hapus event "${eventName}"? ${photoCount} foto akan ikut terhapus.`)) {
      return
    }

    const loadingToastId = toast.showLoading(`Menghapus event "${eventName}"...`)

    try {
      const response = await fetch(`/api/admin/events/${event_id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      toast.updateToast(loadingToastId, 'success', `Event "${eventName}" berhasil dihapus!`, {
        description: `${photoCount} foto telah dihapus`
      })

      fetchEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal menghapus event', {
        description: 'Silakan coba lagi'
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'ARCHIVED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout>
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <MobileEventsPage />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6">
        {/* Error Alert */}
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-1">
              Manage your photography events and sessions
            </p>
          </div>
          <Link
            href="/admin/events/create"
            className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first photography event to start managing your business
            </p>
            <Link
              href="/admin/events/create"
              className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <Link href={`/admin/events/${event.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-500">/{event.slug}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      <span>{event._count.photos} photos</span>
                    </div>
                    {event.event_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(event.event_date).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="text-sm text-brand-teal hover:text-brand-teal/80 font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      deleteEvent(event.id, event.name, event._count.photos)
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
