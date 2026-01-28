'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarIcon as Calendar,
  PhotoIcon as ImageIcon,
  EyeIcon as Eye,
  ChatBubbleLeftEllipsisIcon as MessageSquare,
  CameraIcon as Camera,
  ArrowUpTrayIcon as Upload,
} from '@heroicons/react/24/outline'

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
  event_date: string | null
  created_at: string
  _count: {
    photos: number
  }
}

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

const quickActions: QuickAction[] = [
  {
    label: 'Create Event',
    href: '/admin/events/create',
    icon: Calendar,
    color: 'bg-detra-gold',
    description: 'New photography event',
  },
  {
    label: 'Upload Photos',
    href: '/admin/photos',
    icon: Upload,
    color: 'bg-blue-500',
    description: 'Add photos to gallery',
  },
  {
    label: 'View Messages',
    href: '/admin/messages',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Client communications',
  },
  {
    label: 'Manage Portfolio',
    href: '/admin/portfolio',
    icon: Camera,
    color: 'bg-purple-500',
    description: 'Update portfolio',
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-detra-gold"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {typeof error === 'string'
            ? error
            : 'An error occurred while loading dashboard data'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div className="rounded-xl bg-gradient-to-r from-detra-gold to-detra-dark p-6 text-white">
        <h1 className="mb-2 text-xl font-bold">Welcome back!</h1>
        <p className="text-detra-gold-100 text-sm">
          Here's what's happening with your photography business today.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="mobile-card touch-feedback bg-white p-4"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-10 w-10 ${action.color} flex flex-shrink-0 items-center justify-center rounded-lg`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {action.label}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalEvents || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeEvents || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalPhotos || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.newMessages || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Recent Events
        </h2>
        <div className="space-y-3">
          {recentEvents.length === 0 ? (
            <div className="rounded-xl bg-white p-4 text-center text-gray-500">
              No recent events
            </div>
          ) : (
            recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : 'No date'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(event.status)}`}
                    >
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
