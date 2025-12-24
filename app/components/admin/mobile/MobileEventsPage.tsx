'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarDaysIcon,
  CameraIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface Event {
  id: string
  name: string
  slug: string
  status: string
  event_date: string | null
  _count: {
    photos: number
  }
}

export default function MobileEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus =
      selectedStatus === 'all' || event.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getEventStats = (event: Event) => {
    return [
      { label: 'Photos', value: event._count.photos, icon: CameraIcon },
      { label: 'Views', value: 0, icon: EyeIcon },
    ]
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mobile-card bg-white p-4">
            <div className="space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="flex space-x-2">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-20 rounded" />
              </div>
              <div className="flex space-x-4">
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          {['all', 'ACTIVE', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                selectedStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => router.push(`/admin/events/${event.id}`)}
            className="mobile-card cursor-pointer bg-white p-4"
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-500">{event.slug}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    event.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : event.status === 'PUBLISHED'
                        ? 'bg-blue-100 text-blue-700'
                        : event.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {event.status}
                </span>
                {event.event_date && (
                  <span className="flex items-center text-xs text-gray-600">
                    <CalendarDaysIcon className="mr-1 h-3 w-3" />
                    {new Date(event.event_date).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {getEventStats(event).map((stat, idx) => (
                  <div key={idx} className="flex items-center text-gray-600">
                    <stat.icon className="mr-1 h-4 w-4" />
                    <span className="text-sm">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Button */}
      <button
        onClick={() => router.push('/admin/events/create')}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  )
}
