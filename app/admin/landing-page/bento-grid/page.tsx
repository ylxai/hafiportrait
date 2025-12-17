'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { Grid3x3, Image as ImageIcon, Star } from 'lucide-react'
import Image from 'next/image'

interface PortfolioPhoto {
  id: string
  filename: string
  original_url: string
  thumbnail_url: string
  category: string | null
  is_featuredBento: boolean
  bentoSize: string | null
  bentoPriority: number | null
}

export default function BentoGridPage() {
  const [allPhotos, setAllPhotos] = useState<PortfolioPhoto[]>([])
  const [bentoPhotos, setBentoPhotos] = useState<PortfolioPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const [allResponse, bentoResponse] = await Promise.all([
        fetch('/api/admin/portfolio', { credentials: 'include' }),
        fetch('/api/admin/bento-grid', { credentials: 'include' })
      ])

      if (allResponse.ok) {
        const data = await allResponse.json()
        setAllPhotos(data.photos || [])
      }

      if (bentoResponse.ok) {
        const data = await bentoResponse.json()
        setBentoPhotos(data || [])
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBento = async (photo_id: string, currentState: boolean) => {
    try {
      if (currentState) {
        // Remove from bento grid
        await fetch(`/api/admin/bento-grid/${photo_id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      } else {
        // Add to bento grid
        await fetch('/api/admin/bento-grid', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo_id,
            bentoSize: 'medium',
            bentoPriority: 0
          })
        })
      }

      await fetchPhotos()
    } catch (error) {
      console.error('Error toggling bento:', error)
    }
  }

  const handleUpdateSize = async (photo_id: string, size: string) => {
    try {
      await fetch(`/api/admin/bento-grid/${photo_id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bentoSize: size })
      })

      await fetchPhotos()
    } catch (error) {
      console.error('Error updating size:', error)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bento Grid Gallery</h1>
          <p className="text-gray-600 mt-1">
            Pilih foto terbaik untuk ditampilkan di bento grid homepage
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Grid3x3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bentoPhotos.length}</p>
                <p className="text-sm text-gray-600">Featured in Bento</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allPhotos.length}</p>
                <p className="text-sm text-gray-600">Total Portfolio</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((bentoPhotos.length / Math.max(allPhotos.length, 1)) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Featured Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bento Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Current Bento Grid ({bentoPhotos.length})</h2>
            <p className="text-sm text-gray-600 mt-1">
              These photos are currently displayed on the homepage
            </p>
          </div>
          {bentoPhotos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No photos in bento grid yet. Select photos from the portfolio below.
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bentoPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={photo.thumbnail_url}
                      alt={photo.filename}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleToggleBento(photo.id, true)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <select
                    value={photo.bentoSize || 'medium'}
                    onChange={(e) => handleUpdateSize(photo.id, e.target.value)}
                    className="mt-2 w-full text-xs border rounded px-2 py-1"
                  >
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="wide">Wide</option>
                    <option value="tall">Tall</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Portfolio Photos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Portfolio Photos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on a photo to add it to the bento grid
            </p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : allPhotos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No portfolio photos yet. Upload photos to your portfolio first.
            </div>
          ) : (
            <div className="p-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
              {allPhotos.map((photo) => {
                const is_featured = bentoPhotos.some((p) => p.id === photo.id)
                return (
                  <button
                    key={photo.id}
                    onClick={() => handleToggleBento(photo.id, is_featured)}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden group ${
                      is_featured ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <Image
                      src={photo.thumbnail_url}
                      alt={photo.filename}
                      fill
                      className="object-cover"
                    />
                    <div
                      className={`absolute inset-0 transition-opacity ${
                        is_featured
                          ? 'bg-purple-500/30'
                          : 'bg-black/20 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {is_featured && (
                        <div className="absolute top-1 right-1">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
