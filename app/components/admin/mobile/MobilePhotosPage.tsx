'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload, Filter, Image as ImageIcon } from 'lucide-react'

interface Photo {
  id: string
  filename: string
  thumbnailUrl: string
  event: {
    name: string
  }
}

export default function MobilePhotosPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/admin/photos', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPhotos = photos.filter(photo =>
    photo.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.event.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-4">
        <div className="photo-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Photos Grid */}
      <div className="photo-grid">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => router.push(`/admin/photos/${photo.id}`)}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer"
          >
            <img
              src={photo.thumbnailUrl}
              alt={photo.filename}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <button
        onClick={() => router.push('/admin/photos/upload')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Upload className="w-6 h-6" />
      </button>
    </div>
  )
}
