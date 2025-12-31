'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PhotoUploader from '@/components/admin/PhotoUploader'
import PhotoUploaderPersistent from '@/components/admin/PhotoUploaderPersistent'
import { UploadErrorBoundary } from '@/components/error-boundaries'
import { ArrowLeftIcon as ArrowLeft } from '@heroicons/react/24/outline'
import ErrorAlert from '@/components/ui/ErrorAlert'

interface AdminEventListItem {
  id: string
  name: string
  slug: string
  status: string
  event_date: string | null
  created_at: string
  _count: {
    photos: number
  }
}

export default function AdminPhotosUploadPage() {
  const [events, setEvents] = useState<AdminEventListItem[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usePersistent, setUsePersistent] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch many events for picker. API supports paging; ask for a large limit.
        const qs = new URLSearchParams({ page: '1', limit: '200', search })
        const res = await fetch(`/api/admin/events?${qs.toString()}`, {
          credentials: 'include',
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load events')
        }

        setEvents((data?.events || []) as AdminEventListItem[])
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load events'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search slightly
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [search])

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Photos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload cepat dari tab Photos. Pilih event terlebih dulu.
            </p>
          </div>

          <Link
            href="/admin/photos"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-teal hover:text-brand-teal/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Photos
          </Link>
        </div>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {/* Event picker */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cari event
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau slug..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-teal"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tips: ketik sebagian nama event untuk mempercepat.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pilih event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-teal"
              >
                <option value="">{loading ? 'Loading events...' : '— Pilih event —'}</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev._count?.photos ?? 0} photos)
                  </option>
                ))}
              </select>
              {selectedEvent && (
                <p className="mt-1 text-xs text-gray-500">
                  Slug: <span className="font-mono">{selectedEvent.slug}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Uploader */}
        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Mode Upload</h2>
              <p className="text-xs text-gray-500">
                Default: Standard (stabil). Persistent cocok untuk upload besar / resume.
              </p>
            </div>

            <div className="inline-flex items-center gap-2">
              <span className={`text-xs font-medium ${!usePersistent ? 'text-gray-900' : 'text-gray-500'}`}>
                Standard
              </span>
              <button
                type="button"
                onClick={() => setUsePersistent((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  usePersistent ? 'bg-brand-teal' : 'bg-gray-300'
                }`}
                aria-label="Toggle persistent upload"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    usePersistent ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium ${usePersistent ? 'text-gray-900' : 'text-gray-500'}`}>
                Persistent
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {!selectedEvent ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-600">
              Pilih event dulu untuk mulai upload.
            </div>
          ) : (
            <UploadErrorBoundary errorContext="Global Photo Upload" eventId={selectedEvent.id}>
              {usePersistent ? (
                <PhotoUploaderPersistent
                  event_id={selectedEvent.id}
                  eventName={selectedEvent.name}
                />
              ) : (
                <PhotoUploader event_id={selectedEvent.id} eventName={selectedEvent.name} />
              )}
            </UploadErrorBoundary>
          )}
        </div>
      </div>
    </div>
  )
}
