'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface StoryViewProps {
  isOpen: boolean;
  photos: Array<{ url: string; filename: string }>;
  onClose: () => void;
  duration?: number;
}

export default function StoryView({ 
  isOpen, 
  photos, 
  onClose, 
  duration = 5 
}: StoryViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const pausedProgressRef = useRef<number>(0)

  const currentPhoto = photos[currentIndex]

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setProgress(0)
      setIsPaused(false)
    }
  }, [isOpen])

  const nextSlide = useCallback(() => {
    pausedProgressRef.current = 0
    setProgress(0)
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose() // End of story
    }
  }, [currentIndex, photos.length, onClose]) // dependencies

  // Timer logic
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
      return
    }

    let start = performance.now()
    // Adjust start time if resuming
    if (pausedProgressRef.current > 0) {
       start = start - (pausedProgressRef.current * duration * 1000 / 100)
    }

    const animate = (time: number) => {
      const elapsed = time - start
      const newProgress = (elapsed / (duration * 1000)) * 100

      if (newProgress >= 100) {
        setProgress(100)
        nextSlide()
      } else {
        setProgress(newProgress)
        timerRef.current = requestAnimationFrame(animate)
      }
    }

    timerRef.current = requestAnimationFrame(animate)

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [isOpen, currentIndex, isPaused, duration, nextSlide]) // Added nextSlide

  // ... (rest of functions)

  const prevSlide = () => {
    pausedProgressRef.current = 0
    setProgress(0)
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      // Restart story?
      setCurrentIndex(0)
    }
  }

  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false)
    } else {
      // Pause
      setIsPaused(true)
      pausedProgressRef.current = progress
    }
  }

  if (!isOpen || !currentPhoto) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[80] bg-black"
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {photos.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
              }} 
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="h-8 w-8 overflow-hidden rounded-full border border-white/50">
          <Image src="/images/logo-placeholder.png" width={32} height={32} alt="Logo" className="bg-white object-cover" />
        </div>
        <span className="font-medium text-white shadow-black drop-shadow-md">Cinematic Story</span>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2 text-white/80 hover:text-white"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      {/* Main Content */}
      <div 
        className="relative h-full w-full"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }} // Slow fade for cinematic feel
            className="relative h-full w-full"
          >
            {/* Background blur for fill */}
            <div className="absolute inset-0 z-0">
               <Image
                src={currentPhoto.url}
                alt=""
                fill
                className="scale-110 blur-3xl opacity-50 object-cover"
              />
            </div>
            
            {/* Main Image */}
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.filename}
              fill
              className="z-10 object-contain"
              priority
            />
            
            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Tap Areas */}
        <div className="absolute inset-0 z-20 flex">
          <div className="h-full w-1/3" onClick={prevSlide} />
          <div className="h-full w-1/3" onClick={togglePause} /> {/* Center tap toggles pause */}
          <div className="h-full w-1/3" onClick={nextSlide} />
        </div>
      </div>
    </motion.div>
  )
}
