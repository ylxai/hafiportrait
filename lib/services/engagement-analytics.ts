/**
 * Engagement Analytics Service
 * Provides analytics data for photo likes and engagement metrics
 */

import prisma from '@/lib/prisma';

export interface PhotoEngagementStats {
  photoId: string;
  filename: string;
  likesCount: number;
  viewsCount: number;
  downloadCount: number;
  engagementScore: number;
  thumbnailUrl?: string;
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
  photoId: string;
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
  eventId: string,
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
  const photos = await prisma.photo.findMany({
    where: { eventId },
    select: {
      id: true,
      filename: true,
      likesCount: true,
      viewsCount: true,
      downloadCount: true,
      thumbnailUrl: true,
    },
    orderBy: {
      likesCount: 'desc',
    },
  });

  // Calculate totals
  const totalLikes = photos.reduce((sum, p) => sum + p.likesCount, 0);
  const totalViews = photos.reduce((sum, p) => sum + p.viewsCount, 0);
  const totalDownloads = photos.reduce((sum, p) => sum + p.downloadCount, 0);
  const totalPhotos = photos.length;
  const averageLikesPerPhoto = totalPhotos > 0 ? totalLikes / totalPhotos : 0;

  // Get most liked photos with engagement score
  const mostLikedPhotos: PhotoEngagementStats[] = photos
    .slice(0, limit)
    .map((photo) => ({
      photoId: photo.id,
      filename: photo.filename,
      likesCount: photo.likesCount,
      viewsCount: photo.viewsCount,
      downloadCount: photo.downloadCount,
      engagementScore: calculateEngagementScore(
        photo.likesCount,
        photo.viewsCount,
        photo.downloadCount
      ),
      thumbnailUrl: photo.thumbnailUrl || undefined,
    }));

  // Get recent activity
  const recentActivity = await getRecentActivity(eventId, dateFilter, limit);

  // Get likes trend (last 7 days)
  const likesTrend = await getLikesTrend(eventId, 7);

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
  eventId: string,
  dateFilter: any,
  limit: number
): Promise<ActivityLog[]> {
  // Get recent likes
  const recentLikes = await prisma.photoLike.findMany({
    where: {
      photo: { eventId },
      ...(Object.keys(dateFilter).length > 0 && {
        createdAt: dateFilter,
      }),
    },
    select: {
      id: true,
      guestId: true,
      photoId: true,
      createdAt: true,
      photo: {
        select: {
          filename: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return recentLikes.map((like) => ({
    id: like.id,
    type: 'like' as const,
    photoId: like.photoId,
    photoFilename: like.photo.filename,
    guestId: like.guestId,
    timestamp: like.createdAt,
  }));
}

/**
 * Get likes trend data for the last N days
 */
async function getLikesTrend(
  eventId: string,
  days: number
): Promise<TrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get likes grouped by date
  const likes = await prisma.photoLike.findMany({
    where: {
      photo: { eventId },
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
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
    const dateStr = like.createdAt.toISOString().split('T')[0];
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
  eventId: string,
  limit: number = 10
): Promise<PhotoEngagementStats[]> {
  const photos = await prisma.photo.findMany({
    where: { eventId },
    select: {
      id: true,
      filename: true,
      likesCount: true,
      viewsCount: true,
      downloadCount: true,
      thumbnailUrl: true,
    },
    orderBy: {
      likesCount: 'desc',
    },
    take: limit,
  });

  return photos.map((photo) => ({
    photoId: photo.id,
    filename: photo.filename,
    likesCount: photo.likesCount,
    viewsCount: photo.viewsCount,
    downloadCount: photo.downloadCount,
    engagementScore: calculateEngagementScore(
      photo.likesCount,
      photo.viewsCount,
      photo.downloadCount
    ),
    thumbnailUrl: photo.thumbnailUrl || undefined,
  }));
}

/**
 * Detect bulk like patterns (potential abuse)
 */
export async function detectBulkLikePatterns(
  eventId: string,
  timeWindowMinutes: number = 10,
  threshold: number = 50
): Promise<string[]> {
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - timeWindowMinutes);

  // Get recent likes grouped by guest
  const recentLikes = await prisma.photoLike.groupBy({
    by: ['guestId'],
    where: {
      photo: { eventId },
      createdAt: {
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
  eventId: string
): Promise<string> {
  const photos = await prisma.photo.findMany({
    where: { eventId },
    select: {
      id: true,
      filename: true,
      likesCount: true,
      viewsCount: true,
      downloadCount: true,
      createdAt: true,
    },
    orderBy: {
      likesCount: 'desc',
    },
  });

  // Create CSV header
  let csv = 'Photo ID,Filename,Likes,Views,Downloads,Engagement Score,Upload Date\n';

  // Add data rows
  photos.forEach((photo) => {
    const engagementScore = calculateEngagementScore(
      photo.likesCount,
      photo.viewsCount,
      photo.downloadCount
    );
    
    csv += `${photo.id},"${photo.filename}",${photo.likesCount},${photo.viewsCount},${photo.downloadCount},${engagementScore.toFixed(2)},${photo.createdAt.toISOString()}\n`;
  });

  return csv;
}
