'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDaysIcon,
  PhotoIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'event' | 'photo' | 'message' | 'user'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/activity', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'event':
        return CalendarDaysIcon
      case 'photo':
        return PhotoIcon
      case 'message':
        return ChatBubbleLeftIcon
      case 'user':
        return UserIcon
      default:
        return ClockIcon
    }
  }

  const getIconColor = (type: Activity['type']) => {
    switch (type) {
      case 'event':
        return 'bg-purple-50 text-purple-600'
      case 'photo':
        return 'bg-pink-50 text-pink-600'
      case 'message':
        return 'bg-blue-50 text-blue-600'
      case 'user':
        return 'bg-green-50 text-green-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-start space-x-4">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Recent Activity
      </h2>
      {activities.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start space-x-4">
                <div
                  className={`rounded-lg p-2 ${getIconColor(activity.type)}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: id,
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
