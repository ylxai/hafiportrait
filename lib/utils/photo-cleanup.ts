import prisma from '@/lib/prisma'
import { del } from '@vercel/blob'

export interface CleanupStats {
  photosProcessed: number
  photosDeleted: number
  photosFailed: number
  filesDeleted: number
  filesFailed: number
  storageFreed: number // in bytes
}

/**
 * Cleanup photos that have been soft-deleted for more than specified days
 * @param daysOld Number of days since deletion (default: 30)
 * @returns Cleanup statistics
 */
export async function cleanupDeletedPhotos(
  daysOld: number = 30
): Promise<CleanupStats> {
  const stats: CleanupStats = {
    photosProcessed: 0,
    photosDeleted: 0,
    photosFailed: 0,
    filesDeleted: 0,
    filesFailed: 0,
    storageFreed: 0,
  }

  try {
    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Find photos to cleanup (soft-deleted > daysOld)
    const photosToCleanup = await prisma.photos.findMany({
      where: {
        deleted_at: {
          not: null,
          lte: cutoffDate,
        },
      },
      select: {
        id: true,
        filename: true,
        original_url: true,
        thumbnail_url: true,
        thumbnail_small_url: true,
        thumbnail_medium_url: true,
        thumbnail_large_url: true,
        file_size: true,
        deleted_at: true,
      },
      take: 50, // Process in batches of 50
    })
    for (const photo of photosToCleanup) {
      stats.photosProcessed++

      try {
        // Delete all storage files
        const filesToDelete = [
          photo.original_url,
          photo.thumbnail_small_url,
          photo.thumbnail_medium_url,
          photo.thumbnail_large_url,
          photo.thumbnail_url,
        ].filter(Boolean) as string[]

        let photoStorageFreed = 0

        for (const fileUrl of filesToDelete) {
          try {
            await del(fileUrl)
            stats.filesDeleted++
          } catch (error) {
            stats.filesFailed++
            console.error(`Failed to delete file ${fileUrl}:`, error)
            // Continue with other files
          }
        }

        // Track storage freed (use file_size for original, estimate thumbnails)
        if (photo.file_size) {
          photoStorageFreed = photo.file_size
          stats.storageFreed += photoStorageFreed
        }

        // Delete database record permanently
        await prisma.photos.delete({
          where: { id: photo.id },
        })

        stats.photosDeleted++
      } catch (error) {
        stats.photosFailed++
        console.error(`Failed to cleanup photo ${photo.id}:`, error)
        // Continue with next photo
      }
    }
    return stats
  } catch (error) {
    console.error('Error during cleanup:', error)
    throw error
  }
}

/**
 * Get statistics about photos in trash
 */
export async function getTrashStats() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalDeleted, oldDeleted] = await Promise.all([
      prisma.photos.count({
        where: {
          deleted_at: { not: null },
        },
      }),
      prisma.photos.count({
        where: {
          deleted_at: {
            not: null,
            lte: thirtyDaysAgo,
          },
        },
      }),
    ])

    return {
      totalDeleted,
      oldDeleted,
      readyForCleanup: oldDeleted,
      lastChecked: now.toISOString(),
      daysUntilCleanup: Math.max(
        0,
        30 -
          Math.floor(
            (now.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
          )
      ),
    }
  } catch (error) {
    console.error('Error getting trash stats:', error)
    throw error
  }
}
