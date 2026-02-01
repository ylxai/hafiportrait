'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'

interface Event {
  id: string
  title: string
  couple: string
  date: string
  location: string
  guests: number
  coverImage: string
  slug: string
  testimonial?: string
}

interface PublicEvent {
  id: string
  slug: string
  name: string
  coupleName?: string
  event_date: string
  coverPhotoUrl: string
  photoCount: number
}

export default function FeaturedEventsCarousel() {
  const [events, setEvents] = useState<Event[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch('/api/public/events')
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data?.events)) {
          const mapped = data.events
            .filter((event: PublicEvent) => Boolean(event.coverPhotoUrl))
            .map((event: PublicEvent) => ({
              id: event.id,
              title: event.name,
              couple: event.coupleName || event.name,
              date: new Date(event.event_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              }),
              location: 'Indonesia',
              guests: event.photoCount || 0,
              coverImage: event.coverPhotoUrl,
              slug: event.slug,
              testimonial: undefined,
            }))
          setEvents(mapped)
        }
      } catch (_) {
        return
      }
    }

    loadEvents()
  }, [])

  useEffect(() => {
    if (events.length === 0) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [events])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      let newIndex = prevIndex + newDirection
      if (newIndex < 0) newIndex = events.length - 1
      if (newIndex >= events.length) newIndex = 0
      return newIndex
    })
  }

  const currentEvent = events[currentIndex]

  // Guard against invalid event data
  if (!currentEvent) {
    return null
  }

  return (
    <section
      id="events"
      className="section bg-gradient-to-b from-detra-black to-detra-dark"
    >
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-serif text-2xl font-bold text-white md:text-3xl">
            Recent <span className="italic text-detra-gold">Celebrations</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-detra-light">
            Real weddings, real love stories. Explore our latest work.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative mx-auto max-w-6xl">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 md:aspect-[21/9]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                {/* Background Image - WITH REAL IMAGES FROM UNSPLASH */}
                {!imageError[currentEvent.id] ? (
                  <Image
                    src={currentEvent.coverImage}
                    alt={`${currentEvent.couple} wedding`}
                    fill
                    className="object-cover"
                    priority={currentIndex === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    onError={() => {
                      setImageError((prev) => ({
                        ...prev,
                        [currentEvent.id]: true,
                      }))
                    }}
                  />
                ) : (
                  /* Fallback gradient with subtle pattern */
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-pink-200 to-purple-200">
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                      }}
                    />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white md:p-12">
                  <div className="max-w-3xl">
                    {/* Event Category */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-4 inline-block rounded-full bg-detra-black/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
                    >
                      {currentEvent.title}
                    </motion.div>

                    {/* Couple Names */}
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4 font-serif text-3xl font-bold md:text-5xl"
                    >
                      {currentEvent.couple}
                    </motion.h3>

                    {/* Event Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mb-6 flex flex-wrap gap-4 text-sm md:gap-6 md:text-base"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>{currentEvent.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{currentEvent.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4" />
                        <span>{currentEvent.guests} guests</span>
                      </div>
                    </motion.div>

                    {/* Testimonial */}
                    {currentEvent.testimonial && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mb-6 max-w-2xl text-sm italic text-white/90 md:text-base"
                      >
                        "{currentEvent.testimonial}"
                      </motion.p>
                    )}

                    {/* View Gallery Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="inline-flex transform items-center gap-2 rounded-full bg-detra-black px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-rose-500 hover:text-white"
                    >
                      View Full Gallery
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 top-1/2 z-30 -translate-y-1/2 transform rounded-full bg-detra-black/20 p-3 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-detra-black/30"
              aria-label="Previous event"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 top-1/2 z-30 -translate-y-1/2 transform rounded-full bg-detra-black/20 p-3 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-detra-black/30"
              aria-label="Next event"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-detra-black'
                      : 'bg-detra-black/50 hover:bg-detra-black/70'
                  }`}
                  aria-label={`Go to event ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
