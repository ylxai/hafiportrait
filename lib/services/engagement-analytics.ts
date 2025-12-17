/**
 * Engagement Analytics Service
 * Provides analytics data for photo likes and engagement metrics
 */

import prisma from '@/lib/prisma';

export interface PhotoEngagementStats {
  photo_id: string;
  filename: string;
  likes_count: number;
  views_count: number;
  download_count: number;
  engagementScore: number;
  thumbnail_url?: string;
}

export interface EventEngagementSummary {
  totalLikes: number;
  totalViews: number;
  totalDownloads: number;
  totalPhotos: number;
  averageLikesPerPhoto: number;
  mostLikedPhotos: PhotoEngagementStats[];
  recentActivity: ActivityLog[];
  likesTrend: TrendData[];
}

export interface ActivityLog {
  id: string;
  type: 'like' | 'view' | 'download';
  photo_id: string;
  photoFilename: string;
  guestId: string;
  timestamp: Date;
}

export interface TrendData {
  date: string;
  likes: number;
  views: number;
  downloads: number;
}

/**
 * Get engagement analytics for an event
 */
export async function getEventEngagementAnalytics(
  event_id: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<EventEngagementSummary> {
  const { startDate, endDate, limit = 10 } = options;

  // Build date filter
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  // Get all photos for the event
  const photos = await prisma.photos.findMany({
    where: { event_id },
    select: {
      id: true,
      filename: true,
      likes_count: true,
      views_count: true,
      download_count: true,
      thumbnail_url: true,
    },
    orderBy: {
      likes_count: 'desc',
    },
  });

  // Calculate totals
  const totalLikes = photos.reduce((sum, p) => sum + p.likes_count, 0);
  const totalViews = photos.reduce((sum, p) => sum + p.views_count, 0);
  const totalDownloads = photos.reduce((sum, p) => sum + p.download_count, 0);
  const totalPhotos = photos.length;
  const averageLikesPerPhoto = totalPhotos > 0 ? totalLikes / totalPhotos : 0;

  // Get most liked photos with engagement score
  const mostLikedPhotos: PhotoEngagementStats[] = photos
    .slice(0, limit)
    .map((photo) => ({
      photo_id: photo.id,
      filename: photo.filename,
      likes_count: photo.likes_count,
      views_count: photo.views_count,
      download_count: photo.download_count,
      engagementScore: calculateEngagementScore(
        photo.likes_count,
        photo.views_count,
        photo.download_count
      ),
      thumbnail_url: photo.thumbnail_url || undefined,
    }));

  // Get recent activity
  const recentActivity = await getRecentActivity(event_id, dateFilter, limit);

  // Get likes trend (last 7 days)
  const likesTrend = await getLikesTrend(event_id, 7);

  return {
    totalLikes,
    totalViews,
    totalDownloads,
    totalPhotos,
    averageLikesPerPhoto,
    mostLikedPhotos,
    recentActivity,
    likesTrend,
  };
}

/**
 * Calculate engagement score
 * Weighted: Likes (50%), Views (30%), Downloads (20%)
 */
function calculateEngagementScore(
  likes: number,
  views: number,
  downloads: number
): number {
  return likes * 0.5 + views * 0.3 + downloads * 0.2;
}

/**
 * Get recent activity logs
 */
async function getRecentActivity(
  event_id: string,
  dateFilter: any,
  limit: number
): Promise<ActivityLog[]> {
  // Get recent likes
  const recentLikes = await prisma.photoLike.findMany({
    where: {
      photo: { event_id },
      ...(Object.keys(dateFilter).length > 0 && {
        created_at: dateFilter,
      }),
    },
    select: {
      id: true,
      guestId: true,
      photo_id: true,
      created_at: true,
      photo: {
        select: {
          filename: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  });

  return recentLikes.map((like) => ({
    id: like.id,
    type: 'like' as const,
    photo_id: like.photo_id,
    photoFilename: like.photo.filename,
    guestId: like.guestId,
    timestamp: like.created_at,
  }));
}

/**
 * Get likes trend data for the last N days
 */
async function getLikesTrend(
  event_id: string,
  days: number
): Promise<TrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get likes grouped by date
  const likes = await prisma.photoLike.findMany({
    where: {
      photo: { event_id },
      created_at: {
        gte: startDate,
      },
    },
    select: {
      created_at: true,
    },
  });

  // Group by date
  const trendMap = new Map<string, number>();
  
  // Initialize all dates with 0
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    trendMap.set(dateStr, 0);
  }

  // Count likes per date
  likes.forEach((like) => {
    const dateStr = like.created_at.toISOString().split('T')[0];
    trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
  });

  // Convert to array and sort
  const trendData: TrendData[] = Array.from(trendMap.entries())
    .map(([date, likes]) => ({
      date,
      likes,
      views: 0, // TODO: Add views tracking
      downloads: 0, // TODO: Add downloads tracking
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return trendData;
}

/**
 * Get top liked photos for an event
 */
export async function getTopLikedPhotos(
  event_id: string,
  limit: number = 10
): Promise<PhotoEngagementStats[]> {
  const photos = await prisma.photos.findMany({
    where: { event_id },
    select: {
      id: true,
      filename: true,
      likes_count: true,
      views_count: true,
      download_count: true,
      thumbnail_url: true,
    },
    orderBy: {
      likes_count: 'desc',
    },
    take: limit,
  });

  return photos.map((photo) => ({
    photo_id: photo.id,
    filename: photo.filename,
    likes_count: photo.likes_count,
    views_count: photo.views_count,
    download_count: photo.download_count,
    engagementScore: calculateEngagementScore(
      photo.likes_count,
      photo.views_count,
      photo.download_count
    ),
    thumbnail_url: photo.thumbnail_url || undefined,
  }));
}

/**
 * Detect bulk like patterns (potential abuse)
 */
export async function detectBulkLikePatterns(
  event_id: string,
  timeWindowMinutes: number = 10,
  threshold: number = 50
): Promise<string[]> {
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - timeWindowMinutes);

  // Get recent likes grouped by guest
  const recentLikes = await prisma.photoLike.groupBy({
    by: ['guestId'],
    where: {
      photo: { event_id },
      created_at: {
        gte: startTime,
      },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gte: threshold,
        },
      },
    },
  });

  return recentLikes.map((group) => group.guestId);
}

/**
 * Export engagement data as CSV
 */
export async function exportEngagementData(
  event_id: string
): Promise<string> {
  const photos = await prisma.photos.findMany({
    where: { event_id },
    select: {
      id: true,
      filename: true,
      likes_count: true,
      views_count: true,
      download_count: true,
      created_at: true,
    },
    orderBy: {
      likes_count: 'desc',
    },
  });

  // Create CSV header
  let csv = 'Photo ID,Filename,Likes,Views,Downloads,Engagement Score,Upload Date\n';

  // Add data rows
  photos.forEach((photo) => {
    const engagementScore = calculateEngagementScore(
      photo.likes_count,
      photo.views_count,
      photo.download_count
    );
    
    csv += `${photo.id},"${photo.filename}",${photo.likes_count},${photo.views_count},${photo.download_count},${engagementScore.toFixed(2)},${photo.created_at.toISOString()}\n`;
  });

  return csv;
}
