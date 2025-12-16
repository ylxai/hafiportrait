'use client'

import { useEffect, useState } from 'react'
import { Calendar, Image, MessageSquare, User, Clock } from 'lucide-react'
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
        credentials: 'include'
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
        return Calendar
      case 'photo':
        return Image
      case 'message':
        return MessageSquare
      case 'user':
        return User
      default:
        return Clock
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${getIconColor(activity.type)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true,
                      locale: id 
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
