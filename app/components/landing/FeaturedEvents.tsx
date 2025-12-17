'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, MapPin, ExternalLink } from 'lucide-react'

interface Event {
  id: string
  name: string
  slug: string
  event_date: string | null
  location: string | null
  coverPhotoUrl: string | null
  totalPhotos: number
  clientName?: string
  isPublic: boolean
}

export default function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedEvents()
  }, [])

  const fetchFeaturedEvents = async () => {
    try {
      const response = await fetch('/api/events/active')
      const data = await response.json()
      if (data.success) {
        setEvents(data.events.slice(0, 3)) // Show only 3 featured events
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !events || events.length === 0) {
    return null // Don't show section if no events
  }

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-brand-teal text-sm font-semibold mb-4">
            Recent Work
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
            Featured Events
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse galleries dari recent events yang kami cover
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {events && events.length > 0 && events.map((event, index) => (
            <Link
              key={event.id}
              href={`/${event.slug}`}
              className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
            >
              {/* Event Cover Image */}
              <div className="relative h-64 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                {event.coverPhotoUrl ? (
                  <Image
                    src={event.coverPhotoUrl}
                    alt={`${event.name} - Event photography cover`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority={index === 0}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Photo Count Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-slate-900 z-10">
                  {event.totalPhotos} photos
                </div>
              </div>

              {/* Event Info */}
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-3 group-hover:text-brand-teal transition-colors">
                  {event.name}
                </h3>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  {event.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-teal" />
                      {new Date(event.event_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-teal" />
                      {event.location}
                    </div>
                  )}
                  {event.clientName && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-teal" />
                      {event.clientName}
                    </div>
                  )}
                </div>

                {/* View Gallery Link */}
                <div className="flex items-center gap-2 text-brand-teal font-semibold group-hover:gap-3 transition-all">
                  View Gallery
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}