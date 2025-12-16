'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
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

const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Garden Wedding',
    couple: 'Sarah & Michael',
    date: 'June 2024',
    location: 'Bali',
    guests: 150,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
    slug: 'sarah-michael-wedding',
    testimonial: 'Absolutely stunning work! They captured every moment perfectly.'
  },
  {
    id: '2',
    title: 'Beach Romance',
    couple: 'Lisa & David',
    date: 'May 2024',
    location: 'Lombok',
    guests: 80,
    coverImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop',
    slug: 'lisa-david-wedding',
    testimonial: 'Professional, creative, and so much fun to work with!'
  },
  {
    id: '3',
    title: 'Urban Elegance',
    couple: 'Amanda & James',
    date: 'April 2024',
    location: 'Banjar',
    guests: 200,
    coverImage: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=2071&auto=format&fit=crop',
    slug: 'amanda-james-wedding',
    testimonial: 'The photos exceeded all our expectations. Thank you!'
  }
]

export default function FeaturedEventsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [imageError, setImageError] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % sampleEvents.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      let newIndex = prevIndex + newDirection
      if (newIndex < 0) newIndex = sampleEvents.length - 1
      if (newIndex >= sampleEvents.length) newIndex = 0
      return newIndex
    })
  }

  const currentEvent = sampleEvents[currentIndex]

  return (
    <section id="events" className="section bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Recent <span className="italic text-rose-500">Celebrations</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real weddings, real love stories. Explore our latest work.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl aspect-[16/10] md:aspect-[21/9] bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
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
                      setImageError(prev => ({...prev, [currentEvent.id]: true}))
                    }}
                  />
                ) : (
                  /* Fallback gradient with subtle pattern */
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-pink-200 to-purple-200">
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                      backgroundSize: '50px 50px'
                    }} />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 text-white">
                  <div className="max-w-3xl">
                    {/* Event Category */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4"
                    >
                      {currentEvent.title}
                    </motion.div>

                    {/* Couple Names */}
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl md:text-5xl font-serif font-bold mb-4"
                    >
                      {currentEvent.couple}
                    </motion.h3>

                    {/* Event Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-wrap gap-4 md:gap-6 mb-6 text-sm md:text-base"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{currentEvent.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{currentEvent.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{currentEvent.guests} guests</span>
                      </div>
                    </motion.div>

                    {/* Testimonial */}
                    {currentEvent.testimonial && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-white/90 text-sm md:text-base italic mb-6 max-w-2xl"
                      >
                        "{currentEvent.testimonial}"
                      </motion.p>
                    )}

                    {/* View Gallery Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-rose-500 hover:text-white transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
                    >
                      View Full Gallery
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all transform hover:scale-110"
              aria-label="Previous event"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all transform hover:scale-110"
              aria-label="Next event"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {sampleEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'
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
