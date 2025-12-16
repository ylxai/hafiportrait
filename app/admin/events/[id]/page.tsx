'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import AdminLayout from '@/app/components/admin/AdminLayout'
import EventForm from '@/app/components/admin/EventForm'
import {
  CheckCircle,
  AlertCircle,
  Download,
  QrCode,
  Trash2,
  Eye,
  Copy,

} from 'lucide-react'

interface Event {
  id: string
  name: string
  slug: string
  status: string
  accessCode: string
  qrCodeUrl: string | null
  clientEmail: string | null
  clientPhone: string | null
  eventDate: string | null
  description: string | null
  location: string | null
  storageDurationDays: number
  createdAt: string
  _count: {
    photos: number
    comments: number
  }
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }

      const data = await response.json()
      setEvent(data.event)
      setLoading(false)
    } catch (err) {
      console.error('Error loading event:', err)
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleUpdate = async (formData: any) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 🔑 FIXED: Use cookies instead of localStorage
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update event')
      }

      setNotification({
        type: 'success',
        message: 'Event updated successfully!',
      })

      setIsEditing(false)
      fetchEvent()
    } catch (error) {
      console.error('Failed to update event:', error)
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update event',
      })
    }
  }

  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true)
      const response = await fetch(
        `/api/admin/events/${eventId}/generate-qr`,
        {
          method: 'POST',
          credentials: 'include', // 🔑 FIXED: Use cookies instead of localStorage
        })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate QR code')
      }

      setNotification({
        type: 'success',
        message: 'QR code generated successfully!',
      })

      fetchEvent()
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      setNotification({
        type: 'error',
        message: 'Failed to generate QR code',
      })
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include', // 🔑 FIXED: Use cookies instead of localStorage
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      setNotification({
        type: 'success',
        message: 'Event deleted successfully!',
      })

      setTimeout(() => {
        router.push('/admin/events')
      }, 1500)
    } catch (error) {
      console.error('Failed to delete event:', error)
      setNotification({
        type: 'error',
        message: 'Failed to delete event',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setNotification({
      type: 'success',
      message: 'Copied to clipboard!',
    })
  }

  const downloadQRCode = () => {
    if (!event?.qrCodeUrl) return

    const link = document.createElement('a')
    link.href = event.qrCodeUrl
    link.download = `${event.slug}-qr-code.png`
    link.click()
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event...</p>
          </div>
        </div>
      </AdminLayout>
      )
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Event not found</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
          >
            Back to Events
          </button>
        </div>
      </AdminLayout>
      )
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const galleryUrl = `${baseUrl}/${event.slug}`
  const galleryUrlWithCode = `${galleryUrl}?code=${event.accessCode}`

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {event.name}
              </h1>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusBadgeColor(
                  event.status
                )}`}
              >
                {event.status}
              </span>
            </div>
            <p className="text-gray-600">
              Created {new Date(event.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors space-x-2"
            >
              <Eye className="w-5 h-5" />
              <span>View Gallery</span>
            </a>
            <a
              href={`/admin/events/${eventId}/photos`}
              className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Manage Photos</span>
            </a>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Event'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`p-4 rounded-lg flex items-start space-x-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium flex-1 ${
                notification.type === 'success'
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Edit Form or Event Details */}
        {isEditing ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Event</h2>
            <EventForm
              onSubmit={handleUpdate}
              initialData={{
                name: event.name,
                slug: event.slug,
                clientEmail: event.clientEmail || '',
                clientPhone: event.clientPhone || '',
                eventDate: event.eventDate
                  ? new Date(event.eventDate).toISOString().split('T')[0]
                  : '',
                description: event.description || '',
                location: event.location || '',
                storageDurationDays: event.storageDurationDays,
              }}
              isEdit={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Statistics */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Photos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {event._count.photos}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Comments</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {event._count.comments}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                <div className="space-y-3">
                  {event.eventDate && (
                    <div>
                      <p className="text-sm text-gray-600">Event Date</p>
                      <p className="text-gray-900">
                        {new Date(event.eventDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {event.location && (
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-gray-900">{event.location}</p>
                    </div>
                  )}

                  {event.description && (
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-900">{event.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Storage Duration</p>
                    <p className="text-gray-900">
                      {event.storageDurationDays} days
                    </p>
                  </div>

                  {event.clientEmail && (
                    <div>
                      <p className="text-sm text-gray-600">Client Email</p>
                      <p className="text-gray-900">{event.clientEmail}</p>
                    </div>
                  )}

                  {event.clientPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Client Phone</p>
                      <p className="text-gray-900">{event.clientPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Access & QR */}
            <div className="space-y-6">
              {/* Access Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Access Info</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Gallery URL</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={galleryUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(galleryUrl)}
                        className="p-2 text-gray-600 hover:text-brand-teal transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Access Code</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={event.accessCode}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-lg font-bold tracking-wider text-center"
                      />
                      <button
                        onClick={() => copyToClipboard(event.accessCode)}
                        className="p-2 text-gray-600 hover:text-brand-teal transition-colors"
                        title="Copy Code"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Direct Access URL
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={galleryUrlWithCode}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(galleryUrlWithCode)}
                        className="p-2 text-gray-600 hover:text-brand-teal transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">QR Code</h3>

                {event.qrCodeUrl ? (
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                      <div className="relative w-full aspect-square">
                        <Image
                          src={event.qrCodeUrl}
                          alt={`QR Code for ${event.name} event`}
                          fill
                          sizes="400px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={downloadQRCode}
                        className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={handleGenerateQR}
                        disabled={generatingQR}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        title="Regenerate QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4 text-sm">
                      No QR code generated yet
                    </p>
                    <button
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
                    >
                      {generatingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-5 h-5" />
                          <span>Generate QR Code</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">
                  Danger Zone
                </h3>
                {showDeleteConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Are you sure? This will delete the event and all its
                      photos permanently.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Event</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
