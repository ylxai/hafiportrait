'use client';

import Image from 'next/image';
/**
 * Engagement Analytics Dashboard Component
 * Displays comprehensive engagement metrics and visualizations
 */

import { useState } from 'react';
import type { EventEngagementSummary } from '@/lib/services/engagement-analytics';
import { 
  HeartIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface EngagementDashboardProps {
  eventId: string;
  eventSlug: string;
  initialData: EventEngagementSummary;
}

export default function EngagementDashboard({
  eventId,
  eventSlug,
  initialData,
}: EngagementDashboardProps) {
  const [data, setData] = useState(initialData);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/analytics?action=export`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engagement-${eventSlug}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Likes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.totalLikes.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <HeartSolidIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Avg: {data.averageLikesPerPhoto.toFixed(1)} per photo
          </p>
        </div>

        {/* Total Views */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <EyeIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {data.totalPhotos > 0
              ? `${(data.totalViews / data.totalPhotos).toFixed(1)} per photo`
              : 'No photos yet'}
          </p>
        </div>

        {/* Total Downloads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Downloads
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.totalDownloads.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {data.totalPhotos > 0
              ? `${(data.totalDownloads / data.totalPhotos).toFixed(1)} per photo`
              : 'No photos yet'}
          </p>
        </div>

        {/* Total Photos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Photos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.totalPhotos.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <PhotoIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            In gallery
          </p>
        </div>
      </div>

      {/* Likes Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Likes Trend (Last 7 Days)
          </h2>
          <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div className="h-64">
          {data.likesTrend.length > 0 ? (
            <SimpleTrendChart data={data.likesTrend} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Most Liked Photos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Most Liked Photos
          </h2>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {data.mostLikedPhotos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Filename
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <HeartIcon className="h-4 w-4 inline" /> Likes
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <EyeIcon className="h-4 w-4 inline" /> Views
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <ArrowDownTrayIcon className="h-4 w-4 inline" /> Downloads
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <ChartBarIcon className="h-4 w-4 inline" /> Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.mostLikedPhotos.map((photo) => (
                  <tr key={photo.photoId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {photo.thumbnailUrl ? (
                        <div className="relative h-12 w-12">
                          <Image
                            src={photo.thumbnailUrl}
                            alt={`Top photo: ${photo.filename}`}
                            fill
                            sizes="48px"
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <PhotoIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{photo.filename}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-red-600">
                      {photo.likesCount}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {photo.viewsCount}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {photo.downloadCount}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-purple-600">
                      {photo.engagementScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No photos with engagement yet
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Recent Activity
        </h2>

        {data.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0">
                  {activity.type === 'like' && (
                    <div className="p-2 bg-red-100 rounded-full">
                      <HeartSolidIcon className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    Guest{' '}
                    <span className="font-medium">
                      {activity.guestId.slice(0, 8)}...
                    </span>{' '}
                    liked{' '}
                    <span className="font-medium">{activity.photoFilename}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple Trend Chart Component
 */
function SimpleTrendChart({ data }: { data: any[] }) {
  const maxLikes = Math.max(...data.map((d) => d.likes), 1);

  return (
    <div className="flex items-end justify-between h-full space-x-2">
      {data.map((item, index) => {
        const height = (item.likes / maxLikes) * 100;
        const date = new Date(item.date);
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
              <div
                className="w-full bg-red-500 rounded-t transition-all hover:bg-red-600"
                style={{ height: `${height}%` }}
                title={`${item.likes} likes on ${item.date}`}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">{dayLabel}</div>
            <div className="text-xs font-medium text-gray-700">{item.likes}</div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
