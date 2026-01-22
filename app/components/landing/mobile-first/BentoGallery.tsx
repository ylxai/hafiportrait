'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon as X, 
  ChevronLeftIcon as ChevronLeft, 
  ChevronRightIcon as ChevronRight 
} from '@heroicons/react/24/outline'
import Image from 'next/image'

interface Photo {
  id: string
  filename: string
  original_url: string
  thumbnail_url: string
  category: string | null
  bentoSize: string | null
}

export default function BentoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [storyMode, setStoryMode] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  useEffect(() => {
    fetchBentoPhotos()
  }, [])

  const fetchBentoPhotos = async () => {
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPhotos(data.photos || [])
        }
      }
    } catch (error) {
      console.error('Error fetching bento photos:', error)
    }
  }

  const categories = [
    'All',
    ...Array.from(
      new Set(
        photos.map((p) => p.category).filter((c): c is string => c !== null)
      )
    ),
  ]

  const filteredPhotos =
    selectedCategory === 'All'
      ? photos
      : photos.filter((p) => p.category === selectedCategory)

  const openStoryMode = (index: number) => {
    if (filteredPhotos[index]) {
      setCurrentPhotoIndex(index)
      setStoryMode(true)
      document.body.style.overflow = 'hidden'
    }
  }

  const closeStoryMode = () => {
    setStoryMode(false)
    document.body.style.overflow = 'auto'
  }

  const nextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev + 1) % filteredPhotos.length)
  }, [filteredPhotos.length])

  const prevPhoto = useCallback(() => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length
    )
  }, [filteredPhotos.length])

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchStart(e.targetTouches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextPhoto()
    }
    if (touchStart - touchEnd < -75) {
      prevPhoto()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!storyMode) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'Escape') closeStoryMode()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [storyMode, prevPhoto, nextPhoto])

  const getGridClass = (size: string | null, index: number) => {
    // Use index for alternating patterns or special positioning
    const isEven = index % 2 === 0

    switch (size) {
      case 'large':
        return 'col-span-2 row-span-2'
      case 'wide':
        return 'col-span-2'
      case 'tall':
        return 'row-span-2'
      default:
        // Alternate default items for visual variety
        return isEven ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1'
    }
  }

  return (
    <section
      id="portfolio"
      className="bg-gradient-to-b from-white to-gray-50 px-4 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-2xl md:text-3xl font-serif font-bold text-white">
            Our <span className="italic text-detra-gold">Portfolio</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm md:text-base text-detra-light">
            A curated collection of our finest work, capturing life's most
            precious moments
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'border border-detra-gray bg-detra-black text-detra-light hover:bg-detra-dark'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Bento Grid Gallery */}
        {filteredPhotos.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p>No photos available in this category yet.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid auto-rows-[200px] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          >
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl ${getGridClass(
                  photo.bentoSize,
                  index
                )}`}
                onClick={() => openStoryMode(index)}
              >
                <Image
                  src={photo.thumbnail_url}
                  alt={photo.filename}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute bottom-4 left-4 right-4">
                    {photo.category && (
                      <span className="text-sm font-medium text-white/90">
                        {photo.category}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Story Mode Viewer */}
        <AnimatePresence>
          {storyMode && filteredPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Close Button */}
              <button
                onClick={closeStoryMode}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Photo Display */}
              <div className="relative flex h-full w-full items-center justify-center">
                <Image
                  src={filteredPhotos[currentPhotoIndex]?.original_url || ''}
                  alt={
                    filteredPhotos[currentPhotoIndex]?.filename ||
                    'Gallery Photo'
                  }
                  fill
                  className="object-contain"
                />
              </div>

              {/* Progress Indicator */}
              <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-1">
                {filteredPhotos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? 'w-8 bg-detra-black'
                        : 'w-1 bg-detra-black/40'
                    }`}
                  />
                ))}
              </div>

              {/* Photo Counter */}
              <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {currentPhotoIndex + 1} / {filteredPhotos.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
