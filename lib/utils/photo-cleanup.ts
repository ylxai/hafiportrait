import prisma from '@/lib/prisma';
import { del } from '@vercel/blob';

export interface CleanupStats {
  photosProcessed: number;
  photosDeleted: number;
  photosFailed: number;
  filesDeleted: number;
  filesFailed: number;
  storageFreed: number; // in bytes
}

/**
 * Cleanup photos that have been soft-deleted for more than specified days
 * @param daysOld Number of days since deletion (default: 30)
 * @returns Cleanup statistics
 */
export async function cleanupDeletedPhotos(daysOld: number = 30): Promise<CleanupStats> {
  const stats: CleanupStats = {
    photosProcessed: 0,
    photosDeleted: 0,
    photosFailed: 0,
    filesDeleted: 0,
    filesFailed: 0,
    storageFreed: 0,
  };

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Find photos to cleanup (soft-deleted > daysOld)
    const photosToCleanup = await prisma.photo.findMany({
      where: {
        deletedAt: {
          not: null,
          lte: cutoffDate,
        },
      },
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        thumbnailUrl: true,
        thumbnailSmallUrl: true,
        thumbnailMediumUrl: true,
        thumbnailLargeUrl: true,
        fileSize: true,
        deletedAt: true,
      },
      take: 50, // Process in batches of 50
    });
    for (const photo of photosToCleanup) {
      stats.photosProcessed++;

      try {
        // Delete all storage files
        const filesToDelete = [
          photo.originalUrl,
          photo.thumbnailSmallUrl,
          photo.thumbnailMediumUrl,
          photo.thumbnailLargeUrl,
          photo.thumbnailUrl,
        ].filter(Boolean) as string[];

        let photoStorageFreed = 0;

        for (const fileUrl of filesToDelete) {
          try {
            await del(fileUrl);
            stats.filesDeleted++;
          } catch (error) {
            stats.filesFailed++;
            console.error(`Failed to delete file ${fileUrl}:`, error);
            // Continue with other files
          }
        }

        // Track storage freed (use fileSize for original, estimate thumbnails)
        if (photo.fileSize) {
          photoStorageFreed = photo.fileSize;
          stats.storageFreed += photoStorageFreed;
        }

        // Delete database record permanently
        await prisma.photo.delete({
          where: { id: photo.id },
        });

        stats.photosDeleted++;
      } catch (error) {
        stats.photosFailed++;
        console.error(`Failed to cleanup photo ${photo.id}:`, error);
        // Continue with next photo
      }
    }
    return stats;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

/**
 * Get statistics about photos in trash
 */
export async function getTrashStats() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalDeleted, oldDeleted] = await Promise.all([
      prisma.photo.count({
        where: {
          deletedAt: { not: null },
        },
      }),
      prisma.photo.count({
        where: {
          deletedAt: {
            not: null,
            lte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return {
      totalDeleted,
      oldDeleted,
      readyForCleanup: oldDeleted,
    };
  } catch (error) {
    console.error('Error getting trash stats:', error);
    throw error;
  }
}
