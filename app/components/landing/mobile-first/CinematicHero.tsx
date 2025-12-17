'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import OptimizedImage, { ImagePresets } from '../../../components/common/OptimizedImage'

interface HeroSlide {
  id: string
  imageUrl: string
  thumbnailUrl: string | null
  title: string | null
  subtitle: string | null
  displayOrder: number
}

interface SlideshowSettings {
  timingSeconds: number
  transitionEffect: string
  autoplay: boolean
}

export default function CinematicHero() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [settings, setSettings] = useState<SlideshowSettings>({
    timingSeconds: 3.5,
    transitionEffect: 'fade',
    autoplay: true
  })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
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
      thumbnailUrl: null,
      title: 'Capture Your',
      subtitle: 'Love Story',
      displayOrder: 0
    },
    {
      id: '2',
      imageUrl: '/images/hero/wedding-2.jpg',
      thumbnailUrl: null,
      title: 'Timeless',
      subtitle: 'Memories',
      displayOrder: 1
    },
    {
      id: '3',
      imageUrl: '/images/hero/wedding-3.jpg',
      thumbnailUrl: null,
      title: 'Every Moment',
      subtitle: 'Matters',
      displayOrder: 2
    },
    {
      id: '4',
      imageUrl: '/images/hero/wedding-4.jpg',
      thumbnailUrl: null,
      title: 'Your Special',
      subtitle: 'Day',
      displayOrder: 3
    }
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
    fetchSlideshow()
  }, [])

  const fetchSlideshow = async () => {
    try {
      const response = await fetch('/api/public/hero-slideshow')
      if (response.ok) {
        const data = await response.json()
        if (data.slides && data.slides.length > 0) {
          setSlides(data.slides)
          const enhancedSettings = {
            ...data.settings,
            timingSeconds: data.settings.timingSeconds > 5 ? 3.5 : data.settings.timingSeconds
          }
          setSettings(enhancedSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching slideshow:', error)
    } finally {
      setIsLoaded(true)
    }
  }

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
    setTouchStart(e.targetTouches[0].clientX)
    setTouchEnd(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
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
      className="relative h-screen w-full overflow-hidden bg-black select-none"
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
            scale: 1
          }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ 
            duration: 0.5,
            ease: 'easeInOut' 
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <OptimizedImage
            src={displaySlides[currentSlide]?.imageUrl || '/images/hero/wedding-1.jpg'}
            alt={`${displaySlides[currentSlide]?.title} ${displaySlides[currentSlide]?.subtitle}` || 'Wedding Photography'}
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
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center pointer-events-none">
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
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight">
              <span className="block text-white/90">
                {displaySlides[currentSlide]?.title || 'Capture Your'}
              </span>
              <span className="block text-white font-serif italic mt-2">
                {displaySlides[currentSlide]?.subtitle || 'Love Story'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light">
              Professional Wedding & Portrait Photography
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 pointer-events-auto">
              <a
                href="#pricing"
                className="group relative px-8 py-4 bg-white text-gray-900 rounded-full font-medium text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
              >
                <span className="relative z-10">Pricelist</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <button
                onClick={scrollToPortfolio}
                className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm text-white rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 active:scale-95"
              >
                View Portfolio
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Dots Indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {displaySlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index)
              pauseAutoplayTemporarily()
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 pointer-events-auto ${
              index === currentSlide 
                ? 'bg-white scale-125' 
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
        transition={{ delay: 0.8, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <button
          onClick={scrollToPortfolio}
          className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors active:scale-95 pointer-events-auto"
          aria-label="Scroll down"
        >
          <span className="text-sm font-light tracking-wider">SCROLL</span>
          <ChevronDown className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  )
}
