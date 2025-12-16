'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Calendar, Camera, Eye, Filter } from 'lucide-react'

interface Event {
  id: string
  name: string
  slug: string
  status: string
  eventDate: string | null
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
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getEventStats = (event: Event) => {
    return [
      { label: 'Photos', value: event._count.photos, icon: Camera },
      { label: 'Views', value: 0, icon: Eye },
    ]
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mobile-card bg-white p-4">
            <div className="space-y-3">
              <div className="skeleton w-3/4 h-5 rounded" />
              <div className="flex space-x-2">
                <div className="skeleton w-16 h-5 rounded-full" />
                <div className="skeleton w-20 h-5 rounded" />
              </div>
              <div className="flex space-x-4">
                <div className="skeleton w-12 h-4 rounded" />
                <div className="skeleton w-12 h-4 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          {['all', 'ACTIVE', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
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
            className="mobile-card bg-white p-4 cursor-pointer"
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-500">{event.slug}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  event.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' :
                  event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {event.status}
                </span>
                {event.eventDate && (
                  <span className="text-xs text-gray-600 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(event.eventDate).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {getEventStats(event).map((stat, idx) => (
                  <div key={idx} className="flex items-center text-gray-600">
                    <stat.icon className="w-4 h-4 mr-1" />
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
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
