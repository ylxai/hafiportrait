'use client'

import AdminLayout from '@/app/components/admin/AdminLayout'
import MobilePhotosPage from '@/app/components/admin/mobile/MobilePhotosPage'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowUpTrayIcon as Upload, 
  PhotoIcon as ImageIcon, 
  MagnifyingGlassIcon as Search, 
  FunnelIcon as Filter, 
  Squares2X2Icon as Grid3x3, 
  ListBulletIcon as List 
} from '@heroicons/react/24/outline'

interface Photo {
  id: string
  filename: string
  original_url: string
  thumbnail_small_url: string | null
  thumbnail_medium_url: string | null
  event_id: string
  is_featured: boolean
  created_at: string
  event?: {
    id: string
    name: string
  }
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/admin/photos', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch photos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
    } catch (error) {
      console.error('Failed to fetch photos:', error)
      setError('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <MobilePhotosPage />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Photos</h1>
            <p className="text-gray-600 mt-1">
              Manage your photography portfolio and event photos
            </p>
          </div>
          <Link
            href="/admin/photos/upload"
            className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search photos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <div className="flex items-center space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-6">
              Upload your first photos to start building your portfolio
            </p>
            <Link
              href="/admin/photos/upload"
              className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
              >
                <Image
                  src={photo.thumbnail_medium_url || photo.thumbnail_small_url || photo.original_url}
                  alt={photo.filename}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16.67vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">
                    {photo.filename}
                  </p>
                  {photo.event && (
                    <p className="text-white/80 text-xs truncate">
                      {photo.event.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
