'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Image,
  Eye,
  Download,
  MessageSquare,
  TrendingUp,
  Plus,
  Camera,
  Upload,
  Users
} from 'lucide-react'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalPhotos: number
  totalViews: number
  totalDownloads: number
  newMessages: number
}

interface RecentEvent {
  id: string
  name: string
  slug: string
  status: string
  eventDate: string | null
  createdAt: string
  _count: {
    photos: number
  }
}

interface QuickAction {
  label: string
  href: string
  icon: any
  color: string
  description: string
}

const quickActions: QuickAction[] = [
  {
    label: 'Create Event',
    href: '/admin/events/create',
    icon: Calendar,
    color: 'bg-brand-teal',
    description: 'New photography event'
  },
  {
    label: 'Upload Photos',
    href: '/admin/photos',
    icon: Upload,
    color: 'bg-blue-500',
    description: 'Add photos to gallery'
  },
  {
    label: 'View Messages',
    href: '/admin/messages',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Client communications'
  },
  {
    label: 'Manage Portfolio',
    href: '/admin/portfolio',
    icon: Camera,
    color: 'bg-purple-500',
    description: 'Update portfolio'
  },
]

export default function MobileDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setStats(data.statistics)
      setRecentEvents(data.recentEvents)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'ARCHIVED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-navy rounded-xl p-6 text-white">
        <h1 className="text-xl font-bold mb-2">Welcome back!</h1>
        <p className="text-brand-teal-100 text-sm">
          Here's what's happening with your photography business today.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="mobile-card bg-white p-4 touch-feedback"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 truncate">{action.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeEvents || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPhotos || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.newMessages || 0}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Events</h2>
        <div className="space-y-3">
          {recentEvents.length === 0 ? (
            <div className="bg-white p-4 rounded-xl text-center text-gray-500">
              No recent events
            </div>
          ) : (
            recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{event.name}</h3>
                    <p className="text-sm text-gray-500">
                      {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(event.status)}`}>
                      {event.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {event._count.photos} photos
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}