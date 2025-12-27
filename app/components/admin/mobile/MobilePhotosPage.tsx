'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'

interface Photo {
  id: string
  filename: string
  thumbnail_url: string
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
      const response = await fetch('/api/admin/photos?page=1&limit=20', {
        credentials: 'include',
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

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.event.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-4">
        <div className="photo-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton aspect-square rounded-lg bg-gray-200"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <input
          type="text"
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Photos Grid */}
      <div className="photo-grid">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => router.push(`/admin/photos/${photo.id}`)}
            className="aspect-square cursor-pointer overflow-hidden rounded-lg"
          >
            <Image
              src={photo.thumbnail_url}
              alt={`Photo: ${photo.filename}`}
              width={300}
              height={300}
              className="h-full w-full object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <button
        onClick={() => router.push('/admin/photos/upload')}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
      >
        <ArrowUpTrayIcon className="h-6 w-6" />
      </button>
    </div>
  )
}
