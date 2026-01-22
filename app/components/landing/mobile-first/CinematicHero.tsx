'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import OptimizedImage from '@/components/common/OptimizedImage'
import { useHeroSlideshowCache } from '@/hooks/useApiCache'

interface HeroSlide {
  id: string
  imageUrl: string
  thumbnail_url: string | null
  title: string | null
  subtitle: string | null
  display_order: number
}

// Interface for raw API response which might have inconsistent naming
interface RawHeroSlide {
  id?: string
  imageUrl?: string
  image_url?: string
  src?: string
  thumbnail_url?: string | null
  title?: string | null
  subtitle?: string | null
  display_order?: number
}

interface SlideshowSettings {
  timingSeconds: number
  transitionEffect: string
  autoplay: boolean
}

interface SlideshowData {
  slides: RawHeroSlide[] // Update to use RawHeroSlide for incoming data
  settings: SlideshowSettings
}

export default function CinematicHero() {
  // Use cached API hook for hero slideshow data
  const {
    data: slideshowData,
  } = useHeroSlideshowCache<SlideshowData>()

  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [settings, setSettings] = useState<SlideshowSettings>({
    timingSeconds: 3.5,
    transitionEffect: 'fade',
    autoplay: true,
  })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // ENHANCED: Swipe gesture state (touch + mouse)
  const [touchStart, setTouchStart] = useState<number>(0)
  const [touchEnd, setTouchEnd] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)

  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ALL useEffects MUST be before any conditional returns (React Hooks Rules)

  // Fix useEffect dependency - ensure it triggers when data changes
  useEffect(() => {
    if (
      slideshowData?.slides &&
      Array.isArray(slideshowData.slides) &&
      slideshowData.slides.length > 0
    ) {
      try {
        // Map API response to component format
        // Since useHeroSlideshowCache is generic typed, we assume slides match HeroSlide or are compatible
        const mappedSlides = slideshowData.slides.map(
          (slide, index) => {
            return {
              id: slide.id || `slide-${index}`,
              imageUrl: slide.imageUrl || slide.image_url || slide.src || '',
              thumbnail_url: slide.thumbnail_url || null,
              title: slide.title || null,
              subtitle: slide.subtitle || null,
              display_order: slide.display_order ?? index,
            }
          }
        )

        setSlides(mappedSlides)

        // Use settings from API or defaults
        const enhancedSettings = slideshowData.settings || {
          timingSeconds: 3.5,
          transitionEffect: 'fade',
          autoplay: true,
        }

        setSettings(enhancedSettings)
      } catch (error) {
        console.error('❌ Error mapping slides:', error)
      }
    }
  }, [slideshowData]) // Explicit dependency on slideshowData

  // Navigation methods (define after all hooks!)
  const nextSlide = useCallback(() => {
    const totalSlides = slides.length
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    const totalSlides = slides.length
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [slides.length])

  // ENHANCED: Autoplay with pause functionality
  useEffect(() => {
    if (slides.length === 0 || !settings.autoplay || isPaused) {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
        autoplayTimerRef.current = null
      }
      return
    }

    autoplayTimerRef.current = setInterval(() => {
      nextSlide()
    }, settings.timingSeconds * 1000)

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [slides.length, settings, isPaused, currentSlide, nextSlide])

  // Use API data only, no fallback images
  const displaySlides = slides.length > 0 ? slides : []

  // Show loading state if no slides (AFTER all hooks!)
  if (displaySlides.length === 0) {
    return (
      <section className="relative flex h-screen w-full items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
          <h1 className="text-3xl font-light tracking-tight md:text-4xl">
            Loading <span className="font-serif italic">Gallery</span>
          </h1>
        </div>
      </section>
    )
  }

  // Pause autoplay temporarily after user interaction
  const pauseAutoplayTemporarily = (duration: number = 3000) => {
    setIsPaused(true)

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }

    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, duration)
  }

  // FIXED: Touch handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches[0]?.clientX) {
      setTouchStart(e.targetTouches[0].clientX)
      setTouchEnd(0)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches[0]?.clientX) {
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      nextSlide()
      pauseAutoplayTemporarily()
    }
    if (isRightSwipe) {
      prevSlide()
      pauseAutoplayTemporarily()
    }

    // Reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  // FIXED: Mouse drag handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setTouchStart(e.clientX)
    setTouchEnd(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setTouchEnd(e.clientX)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
      pauseAutoplayTemporarily()
    }
    if (isRightSwipe) {
      prevSlide()
      pauseAutoplayTemporarily()
    }

    // Reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setTouchStart(0)
      setTouchEnd(0)
    }
  }

  const scrollToPortfolio = () => {
    const element = document.getElementById('portfolio')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      className="relative h-screen w-full select-none overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Slideshow Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
          className="absolute inset-0"
        >
          {/* Fallback gradient BEHIND image */}
          <div className="absolute inset-0 bg-gradient-to-br from-detra-black via-detra-dark to-detra-black" />

          {/* Background Image ABOVE fallback */}
          <OptimizedImage
            src={
              displaySlides[currentSlide]?.imageUrl ||
              '/images/hero/wedding-1.jpg'
            }
            alt={
              `${displaySlides[currentSlide]?.title} ${displaySlides[currentSlide]?.subtitle}` ||
              'Wedding Photography'
            }
            className="absolute inset-0 z-10 h-full w-full object-cover transition-none"
            fill={true}
            sizes="100vw"
            priority={true}
            quality={90}
            placeholder="empty"
          />

          {/* Lighter image overlay for better brightness */}
          <div className="absolute inset-0 z-20 bg-black/20" />

          {/* Lighter gradient overlay for text readability */}
          <div className="absolute inset-0 z-30 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content - SMOOTH ANIMATION */}
      <div className="pointer-events-none relative z-40 flex h-full flex-col items-center justify-center px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Main Title */}
            <h1 className="text-2xl font-light tracking-tight md:text-3xl lg:text-4xl">
              <span className="block text-white">
                {displaySlides[currentSlide]?.title || 'Capture Your'}
              </span>
              <span className="mt-1 block font-serif text-xl italic text-detra-gold md:text-2xl lg:text-3xl">
                {displaySlides[currentSlide]?.subtitle || 'Love Story'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-sm font-light text-detra-light md:text-base">
              Professional Wedding & Portrait Photography
            </p>

            {/* CTA Buttons - Horizontal */}
            <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#pricing"
                className="group relative overflow-hidden rounded-full bg-detra-gold px-6 py-3 text-sm font-semibold text-detra-black transition-all duration-300 hover:scale-105 hover:bg-detra-gold/90 hover:shadow-xl active:scale-95 md:text-base"
              >
                <span className="relative z-10">Price List</span>
              </a>
              <button
                onClick={scrollToPortfolio}
                className="rounded-full border-2 border-detra-gold/50 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-detra-gold hover:bg-detra-gold/10 active:scale-95 md:text-base"
              >
                Our Gallery
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Dots Indicator */}
      <div className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {displaySlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index)
              pauseAutoplayTemporarily()
            }}
            className={`pointer-events-auto h-3 w-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'scale-125 bg-detra-gold'
                : 'bg-white/30 hover:bg-detra-gold/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.8,
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <button
          onClick={scrollToPortfolio}
          className="pointer-events-auto flex flex-col items-center gap-2 text-white/60 transition-colors hover:text-white active:scale-95"
          aria-label="Scroll down"
        >
          <span className="text-sm font-light tracking-wider">SCROLL</span>
          <ChevronDownIcon className="h-6 w-6" />
        </button>
      </motion.div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-1/4 h-32 w-32 rounded-full bg-detra-gold/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 h-40 w-40 rounded-full bg-detra-gold/10 blur-3xl" />
      </div>
    </section>
  )
}
