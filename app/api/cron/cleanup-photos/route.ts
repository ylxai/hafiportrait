/**
 * Cron Job: Cleanup Old Soft-Deleted Photos
 * GET /api/cron/cleanup-photos
 * 
 * Automatically deletes photos that have been soft-deleted for more than 30 days
 * Should be called daily via cron job (Vercel Cron or similar)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFromR2, extractKeyFromUrl } from '@/lib/storage/r2';

/**
 * Clean up old soft-deleted photos
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Find photos deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const photosToDelete = await prisma.photos.findMany({
      where: {
        deleted_at: {
          lte: thirtyDaysAgo,
          not: null,
        },
      },
      select: {
        id: true,
        filename: true,
        original_url: true,
        thumbnail_small_url: true,
        thumbnail_medium_url: true,
        thumbnail_large_url: true,
        deleted_at: true,
      },
    });
    const results = {
      total: photosToDelete.length,
      deleted: 0,
      failed: 0,
      storageCleanedUp: 0,
      storageFailed: 0,
    };

    // Process each photo
    for (const photo of photosToDelete) {
      try {
        // Delete from R2 storage
        const keysToDelete: string[] = [];
        
        if (photo.original_url) {
          const key = extractKeyFromUrl(photo.original_url); if (key) keysToDelete.push(key);
        }
        if (photo.thumbnail_small_url) {
          const key = extractKeyFromUrl(photo.thumbnail_small_url); if (key) keysToDelete.push(key);
        }
        if (photo.thumbnail_medium_url) {
          const key = extractKeyFromUrl(photo.thumbnail_medium_url); if (key) keysToDelete.push(key);
        }
        if (photo.thumbnail_large_url) {
          const key = extractKeyFromUrl(photo.thumbnail_large_url); if (key) keysToDelete.push(key);
        }

        // Delete files from R2
        const deleteResults = await Promise.allSettled(
          keysToDelete.map(key => deleteFromR2(key))
        );

        const successfulDeletes = deleteResults.filter(r => r.status === 'fulfilled').length;
        const failedDeletes = deleteResults.filter(r => r.status === 'rejected').length;

        results.storageCleanedUp += successfulDeletes;
        results.storageFailed += failedDeletes;

        // Permanently delete from database
        await prisma.photos.delete({
          where: { id: photo.id },
        });

        results.deleted++;

      } catch (error) {
        console.error(`Failed to delete photo ${photo.id}:`, error);
        results.failed++;
      }
    }
    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${results.deleted} photos permanently deleted`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
