'use client'

import { useEffect, useState } from 'react'
import { 
  CalendarIcon as Calendar, 
  PhotoIcon as Image, 
  ChatBubbleLeftEllipsisIcon as MessageSquare, 
  ArrowTrendingUpIcon as TrendingUp,
  EyeIcon as Eye,
  ArrowDownTrayIcon as Download,
  HeartIcon as Heart
} from '@heroicons/react/24/outline'
import StatCard from '@/app/components/admin/StatCard'
import RecentActivity from '@/app/components/admin/RecentActivity'
import QuickActions from '@/app/components/admin/QuickActions'
import LineChartCard from '@/app/components/admin/charts/LineChartCard'
import BarChartCard from '@/app/components/admin/charts/BarChartCard'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalPhotos: number
  totalMessages: number
  recentViews: number
  recentDownloads: number
  recentLikes: number
}

interface ChartData {
  uploadsTrend: Array<{ name: string; uploads: number }>
  engagementTrend: Array<{ name: string; views: number; downloads: number; likes: number }>
  topEvents: Array<{ name: string; views: number; downloads: number; likes: number }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalPhotos: 0,
    totalMessages: 0,
    recentViews: 0,
    recentDownloads: 0,
    recentLikes: 0,
  })
  const [chartData, setChartData] = useState<ChartData>({
    uploadsTrend: [],
    engagementTrend: [],
    topEvents: [],
  })
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  // Define function before useEffect
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/charts', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setChartsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchChartData()
  }, [])

  // All conditional returns AFTER all hooks (React Rules of Hooks)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          subtitle={`${stats.activeEvents} active`}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Total Photos"
          value={stats.totalPhotos}
          subtitle="Across all events"
          icon={Image}
          color="pink"
        />
        <StatCard
          title="Messages"
          value={stats.totalMessages}
          subtitle="Client inquiries"
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Recent Activity"
          value={stats.recentViews}
          subtitle="Views today"
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Photo Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentViews}</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentDownloads}</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Likes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentLikes}</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {!chartsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uploads Trend */}
          <LineChartCard
            title="Photo Uploads Trend"
            description="Daily uploads over the last 30 days"
            data={chartData.uploadsTrend}
            lines={[
              { key: 'uploads', name: 'Uploads', color: '#8b5cf6' }
            ]}
            height={300}
          />

          {/* Engagement Trend */}
          <LineChartCard
            title="Engagement Trend"
            description="Views, downloads, and likes over the last 30 days"
            data={chartData.engagementTrend}
            lines={[
              { key: 'views', name: 'Views', color: '#3b82f6' },
              { key: 'downloads', name: 'Downloads', color: '#10b981' },
              { key: 'likes', name: 'Likes', color: '#ec4899' }
            ]}
            height={300}
          />
        </div>
      )}

      {/* Top Events Bar Chart */}
      {!chartsLoading && chartData.topEvents.length > 0 && (
        <BarChartCard
          title="Top 5 Active Events"
          description="Events with highest engagement (views + downloads + likes)"
          data={chartData.topEvents}
          bars={[
            { key: 'views', name: 'Views', color: '#3b82f6' },
            { key: 'downloads', name: 'Downloads', color: '#10b981' },
            { key: 'likes', name: 'Likes', color: '#ec4899' }
          ]}
          height={300}
        />
      )}

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
