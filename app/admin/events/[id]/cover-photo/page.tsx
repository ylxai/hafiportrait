'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { ArrowLeft, Upload, Image as ImageIcon, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Photo {
  id: string
  filename: string
  thumbnail_large_url: string | null
  original_url: string
}

interface Event {
  id: string
  name: string
  coupleName: string | null
  cover_photo_id: string | null
  displayStatus: string | null
}

export default function EventCoverPhotoPage() {
  const params = useParams()
  const router = useRouter()
  const event_id = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [coupleName, setCoupleName] = useState('')
  const [displayStatus, setDisplayStatus] = useState('COMPLETED')

  const fetchEventData = useCallback(async () => {
    try {
      // Fetch event details
      const eventRes = await fetch(`/api/admin/events/${event_id}`)
      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEvent(eventData)
        setCoupleName(eventData.coupleName || eventData.name)
        setDisplayStatus(eventData.displayStatus || 'COMPLETED')
        setSelectedPhotoId(eventData.cover_photo_id)
      }

      // Fetch photos
      const photosRes = await fetch(`/api/admin/events/${event_id}/photos`)
      if (photosRes.ok) {
        const photosData = await photosRes.json()
        setPhotos(photosData.photos || [])
      }
    } catch (error) {
      console.error('Error fetching event data:', error)
    } finally {
      setLoading(false)
    }
  }, [event_id])

  useEffect(() => {
    fetchEventData()
  }, [fetchEventData])

  const handleSave = async () => {
    if (!selectedPhotoId) {
      alert('Please select a cover photo')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/events/${event_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_photo_id: selectedPhotoId,
          coupleName: coupleName,
          displayStatus: displayStatus
        })
      })

      if (response.ok) {
        alert('Cover photo and settings updated successfully!')
        router.push(`/admin/events/${event_id}`)
      } else {
        alert('Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
        </div>
      </AdminLayout>
      )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/events/${event_id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cover Photo & Display Settings</h1>
              <p className="text-gray-600 mt-1">{event?.name}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !selectedPhotoId}
            className="px-6 py-2 bg-brand-cyan text-white rounded-lg hover:bg-brand-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Display Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couple Name (untuk display di landing page)
              </label>
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                placeholder="e.g., Sarah & John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Status
              </label>
              <select
                value={displayStatus}
                onChange={(e) => setDisplayStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
              >
                <option value="LIVE">LIVE NOW (berdenyut hijau)</option>
                <option value="COMPLETED">COMPLETED (merah)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Photo Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Cover Photo</h2>
          
          {photos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No photos uploaded yet</p>
              <Link
                href={`/admin/events/${event_id}/photos/upload`}
                className="inline-flex items-center gap-2 px-6 py-2 bg-brand-cyan text-white rounded-lg hover:bg-brand-cyan/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Photos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedPhotoId === photo.id
                      ? 'ring-4 ring-brand-cyan scale-95'
                      : 'hover:scale-95 hover:ring-2 hover:ring-gray-300'
                  }`}
                >
                  <Image
                    src={photo.thumbnail_large_url || photo.original_url}
                    alt={photo.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  {selectedPhotoId === photo.id && (
                    <div className="absolute inset-0 bg-brand-cyan/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-brand-cyan rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
