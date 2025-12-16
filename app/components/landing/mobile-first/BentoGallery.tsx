'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart, Share2 } from 'lucide-react'
import Image from 'next/image'

interface Photo {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl: string
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
      const response = await fetch('/api/public/bento-grid')
      if (response.ok) {
        const data = await response.json()
        setPhotos(data || [])
      }
    } catch (error) {
      console.error('Error fetching bento photos:', error)
    }
  }

  const categories = ['All', ...Array.from(new Set(photos.map(p => p.category).filter((c): c is string => c !== null)))]

  const filteredPhotos = selectedCategory === 'All' 
    ? photos 
    : photos.filter(p => p.category === selectedCategory)

  const openStoryMode = (index: number) => {
    setCurrentPhotoIndex(index)
    setStoryMode(true)
    document.body.style.overflow = 'hidden'
  }

  const closeStoryMode = () => {
    setStoryMode(false)
    document.body.style.overflow = 'auto'
  }

  const nextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev + 1) % filteredPhotos.length)
  }, [filteredPhotos.length])

  const prevPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)
  }, [filteredPhotos.length])

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
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
    switch (size) {
      case 'large':
        return 'col-span-2 row-span-2'
      case 'wide':
        return 'col-span-2'
      case 'tall':
        return 'row-span-2'
      default:
        return ''
    }
  }

  return (
    <section id="portfolio" className="py-16 md:py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-light mb-4">
            Our <span className="font-serif italic">Portfolio</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            A curated collection of our finest work, capturing life's most precious moments
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Bento Grid Gallery */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No photos available in this category yet.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px]"
          >
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer ${getGridClass(
                  photo.bentoSize,
                  index
                )}`}
                onClick={() => openStoryMode(index)}
              >
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.filename}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    {photo.category && (
                      <span className="text-white/90 text-sm font-medium">
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
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Photo Display */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={filteredPhotos[currentPhotoIndex].originalUrl}
                  alt={filteredPhotos[currentPhotoIndex].filename}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Progress Indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
                {filteredPhotos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? 'w-8 bg-white'
                        : 'w-1 bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Photo Counter */}
              <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {currentPhotoIndex + 1} / {filteredPhotos.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
