'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Loader2, Heart, Eye, Filter } from 'lucide-react'

interface PortfolioPhoto {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl: string
  displayOrder: number
  isFeatured: boolean
  category: string | null
  description: string | null
}

const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Featured']

export default function PortfolioGallery() {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<PortfolioPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState('All')
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const filterPhotos = useCallback(() => {
    if (activeCategory === 'all') {
      setFilteredPhotos(photos)
    } else {
      setFilteredPhotos(photos.filter(photo => photo.category === activeCategory))
    }
  }, [activeCategory, photos])

  useEffect(() => {
    filterPhotos()
  }, [filterPhotos])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio')
      const data = await response.json()
      if (data.success) {
        setPhotos(data.photos)
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }

  const goToPrevious = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1))
  }, [filteredPhotos.length])

  const goToNext = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1))
  }, [filteredPhotos.length])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [lightboxOpen, goToPrevious, goToNext])

  if (isLoading) {
    return (
      <section id="portfolio" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-brand-teal mx-auto" />
            <p className="mt-4 text-slate-600">Loading portfolio...</p>
          </div>
        </div>
      </section>
    )
  }

  if (photos.length === 0) {
    return (
      <section id="portfolio" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-brand-teal text-sm font-semibold mb-4">
              Portfolio
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
              Our Work
            </h2>
            <p className="text-slate-600 mb-12">Portfolio gallery coming soon...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section 
        id="portfolio" 
        ref={sectionRef}
        className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-brand-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-brand-blue/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          
          {/* Section Header */}
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-brand-teal text-sm font-semibold mb-4">
              Our Portfolio
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
              Stories We've Captured
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore our collection of wedding, portrait, and event photography
            </p>
          </div>

          {/* Category Filter */}
          <div className={`flex flex-wrap justify-center gap-3 mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-brand-teal to-brand-blue text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-100 shadow-md'
                }`}
              >
                {category}
                {category === 'Featured' && ' ⭐'}
              </button>
            ))}
          </div>

          {/* Photo Grid - Masonry Style */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No photos in this category yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`group relative aspect-square overflow-hidden rounded-xl md:rounded-2xl cursor-pointer bg-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.description || `Portfolio photo ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-end p-4 md:p-6">
                    <div className="flex items-center gap-4 text-white text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View
                      </span>
                      {photo.isFeatured && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-current text-red-400" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {photo.isFeatured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                      ⭐ Featured
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* View More CTA */}
          {filteredPhotos.length > 0 && (
            <div className="text-center mt-16">
              <button className="group px-8 py-4 bg-gradient-to-r from-brand-teal to-brand-blue text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center gap-2">
                  View Full Gallery
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Lightbox */}
      {lightboxOpen && filteredPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/97 backdrop-blur-md flex items-center justify-center animate-fade-in">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm z-50"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm z-50"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 md:right-8 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm z-50"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Image Container */}
          <div className="relative w-full h-full max-w-7xl max-h-[85vh] mx-auto p-4 md:p-8">
            <Image
              src={filteredPhotos[currentPhotoIndex].originalUrl}
              alt={filteredPhotos[currentPhotoIndex].description || `Portfolio photo ${currentPhotoIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 md:p-8">
            <div className="container mx-auto flex items-center justify-between text-white">
              <div>
                <p className="text-sm text-white/70 mb-1">
                  {currentPhotoIndex + 1} / {filteredPhotos.length}
                </p>
                {filteredPhotos[currentPhotoIndex].description && (
                  <p className="text-base md:text-lg font-medium">
                    {filteredPhotos[currentPhotoIndex].description}
                  </p>
                )}
              </div>
              {filteredPhotos[currentPhotoIndex].isFeatured && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                  <Heart className="w-4 h-4 fill-current text-red-400" />
                  <span className="text-sm font-medium">Featured</span>
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Hints */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4 text-white/50 text-xs">
            <span>← Prev</span>
            <span>•</span>
            <span>ESC Close</span>
            <span>•</span>
            <span>Next →</span>
          </div>
        </div>
      )}
    </>
  )
}
