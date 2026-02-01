'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import AdminLayout from '@/app/components/admin/AdminLayout'
import EventForm from '@/app/components/admin/EventForm'
import {
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle,
  ArrowDownTrayIcon as Download,
  QrCodeIcon as QrCode,
  TrashIcon as Trash2,
  EyeIcon as Eye,
  DocumentDuplicateIcon as Copy,
} from '@heroicons/react/24/outline'

interface Event {
  id: string
  name: string
  slug: string
  status: string
  access_code: string
  qr_code_url: string | null
  client_email: string | null
  client_phone: string | null
  event_date: string | null
  description: string | null
  location: string | null
  storage_duration_days: number
  created_at: string
  _count: {
    photos: number
    comments: number
  }
}

interface EventUpdateFormData {
  name?: string
  slug?: string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  client_email?: string
  client_phone?: string
  event_date?: string
  description?: string
  location?: string
  storage_duration_days?: number
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const event_id = params.id as string

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
      const response = await fetch(`/api/admin/events/${event_id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }

      const data = await response.json()
      setEvent(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading event:', error)
      setLoading(false)
    }
  }, [event_id])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleUpdate = async (formData: EventUpdateFormData) => {
    try {
      const response = await fetch(`/api/admin/events/${event_id}`, {
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
        message:
          error instanceof Error ? error.message : 'Failed to update event',
      })
    }
  }

  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true)
      const response = await fetch(
        `/api/admin/events/${event_id}/generate-qr`,
        {
          method: 'POST',
          credentials: 'include', // 🔑 FIXED: Use cookies instead of localStorage
        }
      )
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
      const response = await fetch(`/api/admin/events/${event_id}`, {
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
    if (!event?.qr_code_url) return

    const link = document.createElement('a')
    link.href = event.qr_code_url
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-brand-teal mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-gray-600">Loading event...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="py-12 text-center">
          <p className="mb-4 text-red-600">Event not found</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="bg-brand-teal hover:bg-brand-teal/90 rounded-lg px-4 py-2 text-white"
          >
            Back to Events
          </button>
        </div>
      </AdminLayout>
    )
  }

  const baseUrl: string =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : typeof window !== 'undefined'
        ? window.location.origin
        : 'https://hafiportrait.photography')
  const galleryUrl = `${baseUrl}/${event.slug}`
  const galleryUrlWithCode = `${galleryUrl}?code=${event.access_code}`

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                {event.name}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeColor(
                  event.status
                )}`}
              >
                {event.status}
              </span>

              {event.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => handleUpdate({ status: 'ACTIVE' })}
                  className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Publish
                </button>
              )}

              {event.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => handleUpdate({ status: 'DRAFT' })}
                  className="inline-flex items-center rounded-lg bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Unpublish
                </button>
              )}
            </div>
            <p className="text-gray-600">
              Created {new Date(event.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href={galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Eye className="h-5 w-5" />
              <span>View Gallery</span>
            </a>
            <a
              href={`/admin/events/${event_id}/photos`}
              className="bg-brand-teal hover:bg-brand-teal/90 inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Manage Photos</span>
            </a>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-brand-teal hover:bg-brand-teal/90 rounded-lg px-4 py-2 text-white transition-colors"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Event'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`flex items-start space-x-3 rounded-lg p-4 ${
              notification.type === 'success'
                ? 'border border-green-200 bg-green-50'
                : 'border border-red-200 bg-red-50'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            )}
            <p
              className={`flex-1 text-sm font-medium ${
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
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Edit Event</h2>
            <EventForm
              onSubmit={handleUpdate}
              initialData={{
                name: event.name,
                slug: event.slug,
                client_email: event.client_email || '',
                client_phone: event.client_phone || '',
                event_date: event.event_date
                  ? new Date(event.event_date).toISOString().split('T')[0]
                  : '',
                description: event.description || '',
                location: event.location || '',
                storage_duration_days: event.storage_duration_days,
              }}
              isEdit={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Event Statistics */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Total Photos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {event._count.photos}
                    </p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Comments</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {event._count.comments}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Event Details</h3>
                <div className="space-y-3">
                  {event.event_date && (
                    <div>
                      <p className="text-sm text-gray-600">Event Date</p>
                      <p className="text-gray-900">
                        {new Date(event.event_date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
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
                      {event.storage_duration_days} days
                    </p>
                  </div>

                  {event.client_email && (
                    <div>
                      <p className="text-sm text-gray-600">Client Email</p>
                      <p className="text-gray-900">{event.client_email}</p>
                    </div>
                  )}

                  {event.client_phone && (
                    <div>
                      <p className="text-sm text-gray-600">Client Phone</p>
                      <p className="text-gray-900">{event.client_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Access & QR */}
            <div className="space-y-6">
              {/* Access Information */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Access Info</h3>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-gray-600">Gallery URL</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={galleryUrl}
                        readOnly
                        className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(galleryUrl)}
                        className="hover:text-brand-teal p-2 text-gray-600 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-gray-600">Access Code</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={event.access_code}
                        readOnly
                        className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-center text-lg font-bold tracking-wider"
                      />
                      <button
                        onClick={() => copyToClipboard(event.access_code)}
                        className="hover:text-brand-teal p-2 text-gray-600 transition-colors"
                        title="Copy Code"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-gray-600">
                      Direct Access URL
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={galleryUrlWithCode}
                        readOnly
                        className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs"
                      />
                      <button
                        onClick={() => copyToClipboard(galleryUrlWithCode)}
                        className="hover:text-brand-teal p-2 text-gray-600 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">QR Code</h3>

                {event.qr_code_url ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                      <div className="relative aspect-square w-full">
                        <Image
                          src={event.qr_code_url}
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
                        className="bg-brand-teal hover:bg-brand-teal/90 flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors"
                      >
                        <Download className="h-5 w-5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={handleGenerateQR}
                        disabled={generatingQR}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        title="Regenerate QR Code"
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <QrCode className="mx-auto mb-3 h-16 w-16 text-gray-400" />
                    <p className="mb-4 text-sm text-gray-600">
                      No QR code generated yet
                    </p>
                    <button
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      className="bg-brand-teal hover:bg-brand-teal/90 mx-auto flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors disabled:opacity-50"
                    >
                      {generatingQR ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-5 w-5" />
                          <span>Generate QR Code</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="rounded-lg border-2 border-red-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-red-600">
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
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-5 w-5" />
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
