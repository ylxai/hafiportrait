'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface EventData {
  id: string
  slug: string
  name: string
  coupleName: string
  eventDate: string
  status: 'LIVE' | 'COMPLETED'
  coverPhotoUrl: string
  photoCount: number
}

export default function DigitalPosterEventList() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/public/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <section id="events" className="section bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="space-y-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
  )

  }
  if (events.length === 0) {
    return null
  }

  return (
    <section id="events" className="section bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Recent <span className="italic text-rose-500">Celebrations</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lihat momen-momen indah dari acara yang telah kami dokumentasikan
          </p>
        </motion.div>

        {/* Event Cards */}
        <div className="space-y-6 max-w-5xl mx-auto">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Link href={`/${event.slug}`}>
                <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
                  {/* Background Image with Parallax Effect */}
                  <div className="absolute inset-0">
                    <Image
                      src={event.coverPhotoUrl}
                      alt={event.coupleName}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={index === 0}
                    />
                  </div>

                  {/* Gradient Overlay - Dark at Bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                    {event.status === 'LIVE' ? (
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg"
                      >
                        <motion.div
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                        LIVE NOW
                      </motion.div>
                    ) : (
                      <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        COMPLETED
                      </div>
                    )}
                  </div>

                  {/* Photo Count Badge */}
                  <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
                    <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      {event.photoCount} Photos
                    </div>
                  </div>

                  {/* Content at Bottom */}
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 text-white z-10">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <h3 className="text-3xl md:text-4xl font-serif font-bold mb-2 drop-shadow-lg">
                        {event.coupleName}
                      </h3>
                      <div className="flex items-center gap-3 text-lg md:text-xl opacity-95">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="drop-shadow-lg">{formatDate(event.eventDate)}</span>
                      </div>
                    </motion.div>

                    {/* Hover Effect Indicator */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="mt-4 hidden group-hover:flex items-center gap-2 text-sm font-medium"
                    >
                      <span>View Gallery</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
