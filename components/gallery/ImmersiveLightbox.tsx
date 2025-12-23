'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  HeartIcon as HeartOutline,
  ArrowDownTrayIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'

interface Photo {
  id: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  filename: string
  likes?: number
  hasLiked?: boolean
}

interface ImmersiveLightboxProps {
  isOpen: boolean
  initialPhotoIndex: number
  photos: Photo[]
  onClose: () => void
  onLike?: (photoId: string) => void
  onDownload?: (photo: Photo) => void
}

export default function ImmersiveLightbox({
  isOpen,
  initialPhotoIndex,
  photos,
  onClose,
  onLike,
  onDownload
}: ImmersiveLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex)
  const [showControls, setShowControls] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  
  // Sync index when initialPhotoIndex changes (on open)
  useEffect(() => {
    setCurrentIndex(initialPhotoIndex)
  }, [initialPhotoIndex])

  // Current photo data
  const photo = photos[currentIndex]

  // Navigation functions wrapped in useCallback
  const nextPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCurrentIndex(0)
    }
  }, [currentIndex, photos.length])

  const prevPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      setCurrentIndex(photos.length - 1)
    }
  }, [currentIndex, photos.length])

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === ' ') {
        e.preventDefault()
        toggleControls()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, nextPhoto, prevPhoto, toggleControls])

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(prev => !prev)
    if (onLike && photo) onLike(photo.id)
  }

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen || !photo) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={toggleControls}
        >
          {/* Main Image Container */}
          <div className="relative h-full w-full flex items-center justify-center p-0 md:p-8">
            <motion.div 
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative h-full w-full max-h-[90vh] max-w-[95vw] md:max-w-5xl"
            >
              <Image
                src={photo.url}
                alt={photo.filename}
                fill
                className="object-contain"
                quality={90}
                priority
              />
            </motion.div>
          </div>

          {/* Controls Layer */}
          <AnimatePresence>
            {showControls && (
              <>
                {/* Top Bar */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-0 left-0 right-0 z-[70] flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-white/90">
                    <span className="font-serif text-lg tracking-wide">{currentIndex + 1} / {photos.length}</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </motion.div>

                {/* Bottom Bar (Actions) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 left-0 right-0 z-[70] bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pb-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto flex max-w-xl items-center justify-between">
                    {/* Left: Like */}
                    <button 
                      onClick={handleLike}
                      className="group flex flex-col items-center gap-1 text-white transition active:scale-95"
                    >
                      {photo.hasLiked || isLiked ? (
                        <HeartSolid className="h-6 w-6 text-rose-500" />
                      ) : (
                        <HeartOutline className="h-6 w-6 group-hover:text-rose-400" />
                      )}
                      <span className="text-[10px] uppercase tracking-wider opacity-70">Like</span>
                    </button>

                    {/* Center: Share */}
                    <button className="group flex flex-col items-center gap-1 text-white transition active:scale-95">
                      <ShareIcon className="h-6 w-6 group-hover:text-blue-400" />
                      <span className="text-[10px] uppercase tracking-wider opacity-70">Share</span>
                    </button>

                    {/* Right: Download */}
                    <button 
                      onClick={() => onDownload?.(photo)}
                      className="group flex flex-col items-center gap-1 text-white transition active:scale-95"
                    >
                      <ArrowDownTrayIcon className="h-6 w-6 group-hover:text-emerald-400" />
                      <span className="text-[10px] uppercase tracking-wider opacity-70">Save</span>
                    </button>
                  </div>
                </motion.div>

                {/* Nav Buttons (Desktop only mostly) */}
                <div className="absolute inset-y-0 left-0 z-[65] hidden w-24 items-center justify-start pl-4 md:flex" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={prevPhoto}
                    className="rounded-full bg-black/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 hover:scale-110"
                  >
                    <ChevronLeftIcon className="h-8 w-8" />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 z-[65] hidden w-24 items-center justify-end pr-4 md:flex" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={nextPhoto}
                    className="rounded-full bg-black/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 hover:scale-110"
                  >
                    <ChevronRightIcon className="h-8 w-8" />
                  </button>
                </div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}