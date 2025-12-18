'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import OptimizedImage, {
  ImagePresets,
} from '@/components/common/OptimizedImage'
import { useHeroSlideshowCache } from '@/hooks/useApiCache'

interface HeroSlide {
  id: string
  imageUrl: string
  thumbnail_url: string | null
  title: string | null
  subtitle: string | null
  display_order: number
}

interface SlideshowSettings {
  timingSeconds: number
  transitionEffect: string
  autoplay: boolean
}

interface SlideshowData {
  slides: HeroSlide[]
  settings: SlideshowSettings
}

export default function CinematicHero() {
  // Use cached API hook for hero slideshow data
  const { data: slideshowData } = useHeroSlideshowCache<SlideshowData>()

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

  // Fallback slides if no data from database
  const fallbackSlides: HeroSlide[] = [
    {
      id: '1',
      imageUrl: '/images/hero/wedding-1.jpg',
      thumbnail_url: null,
      title: 'Capture Your',
      subtitle: 'Love Story',
      display_order: 0,
    },
    {
      id: '2',
      imageUrl: '/images/hero/wedding-2.jpg',
      thumbnail_url: null,
      title: 'Timeless',
      subtitle: 'Memories',
      display_order: 1,
    },
    {
      id: '3',
      imageUrl: '/images/hero/wedding-3.jpg',
      thumbnail_url: null,
      title: 'Every Moment',
      subtitle: 'Matters',
      display_order: 2,
    },
    {
      id: '4',
      imageUrl: '/images/hero/wedding-4.jpg',
      thumbnail_url: null,
      title: 'Your Special',
      subtitle: 'Day',
      display_order: 3,
    },
  ]

  const displaySlides = slides.length > 0 ? slides : fallbackSlides

  // Navigation methods (define first!)
  const nextSlide = useCallback(() => {
    const totalSlides = displaySlides.length
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [displaySlides.length])

  const prevSlide = useCallback(() => {
    const totalSlides = displaySlides.length
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [displaySlides.length])

  useEffect(() => {
    if (slideshowData?.slides && slideshowData.slides.length > 0) {
      setSlides(slideshowData.slides)
      const enhancedSettings = {
        ...slideshowData.settings,
        timingSeconds:
          slideshowData.settings.timingSeconds > 5
            ? 3.5
            : slideshowData.settings.timingSeconds,
      }
      setSettings(enhancedSettings)
    }
  }, [slideshowData])

  // ENHANCED: Autoplay with pause functionality
  useEffect(() => {
    if (displaySlides.length === 0 || !settings.autoplay || isPaused) {
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
  }, [displaySlides.length, settings, isPaused, currentSlide, nextSlide])

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
          {/* Background Image */}
          <OptimizedImage
            src={
              displaySlides[currentSlide]?.imageUrl ||
              '/images/hero/wedding-1.jpg'
            }
            alt={
              `${displaySlides[currentSlide]?.title} ${displaySlides[currentSlide]?.subtitle}` ||
              'Wedding Photography'
            }
            className="absolute inset-0"
            {...ImagePresets.hero}
          />

          {/* Fallback gradient if image doesn't exist */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

          {/* Image overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Main Title */}
            <h1 className="text-3xl font-light tracking-tight md:text-4xl lg:text-5xl">
              <span className="block text-white/90">
                {displaySlides[currentSlide]?.title || 'Capture Your'}
              </span>
              <span className="mt-2 block font-serif italic text-white">
                {displaySlides[currentSlide]?.subtitle || 'Love Story'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-lg font-light text-white/80 md:text-xl">
              Professional Wedding & Portrait Photography
            </p>

            {/* CTA Buttons */}
            <div className="pointer-events-auto mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-lg font-medium text-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
              >
                <span className="relative z-10">Pricelist</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </a>
              <button
                onClick={scrollToPortfolio}
                className="rounded-full border-2 border-white/30 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10 active:scale-95"
              >
                View Portfolio
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
                ? 'scale-125 bg-white'
                : 'bg-white/30 hover:bg-white/60'
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
          <ChevronDown className="h-6 w-6" />
        </button>
      </motion.div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-1/4 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />
      </div>
    </section>
  )
}
