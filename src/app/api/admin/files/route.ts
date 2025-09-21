import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-with-smart-storage';
import fs from 'fs/promises';
import path from 'path';

/**
 * List files and folders for file management
 * POST /api/admin/files
 */
export async function POST(request: NextRequest) {
  try {
    const { path: requestedPath = '/' } = await request.json();

    // Get files from database (photos)
    const photos = await database.getAllPhotos();
    
    // Get storage usage analytics
    const storageStats = await getStorageAnalytics();
    
    // Convert database photos to file items
    const fileItems = photos.map(photo => ({
      id: photo.id,
      name: photo.original_name || `photo-${photo.id}.jpg`,
      type: 'file' as const,
      size: photo.file_size || 0,
      modified: photo.uploaded_at || new Date().toISOString(),
      path: photo.storage_path || '/',
      extension: getFileExtension(photo.original_name || ''),
      isSelected: false,
      metadata: {
        eventId: photo.event_id,
        eventName: photo.event_name,
        albumName: photo.album_name,
        uploadedBy: photo.uploader_name,
        storageTier: photo.storage_tier,
        storageProvider: photo.storage_provider,
        compressionUsed: photo.compression_used
      }
    }));

    // Add local backup files if they exist
    const localFiles = await getLocalBackupFiles();
    fileItems.push(...localFiles);

    // Sort by modification date (newest first)
    fileItems.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json({
      success: true,
      data: {
        files: fileItems,
        stats: storageStats,
        path: requestedPath,
        totalFiles: fileItems.length,
        totalSize: fileItems.reduce((sum, file) => sum + file.size, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error listing files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get storage analytics
 */
async function getStorageAnalytics() {
  try {
    const photos = await database.getAllPhotos();
    
    const stats = {
      totalFiles: photos.length,
      totalSize: photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0),
      byStorageTier: {} as Record<string, { count: number; size: number }>,
      byFileType: {} as Record<string, { count: number; size: number }>,
      byEvent: {} as Record<string, { count: number; size: number }>
    };

    photos.forEach(photo => {
      const tier = photo.storage_tier || 'unknown';
      const extension = getFileExtension(photo.original_name || '');
      const eventName = photo.event_name || 'no-event';
      const size = photo.file_size || 0;

      // By storage tier
      if (!stats.byStorageTier[tier]) {
        stats.byStorageTier[tier] = { count: 0, size: 0 };
      }
      stats.byStorageTier[tier].count++;
      stats.byStorageTier[tier].size += size;

      // By file type
      if (!stats.byFileType[extension]) {
        stats.byFileType[extension] = { count: 0, size: 0 };
      }
      stats.byFileType[extension].count++;
      stats.byFileType[extension].size += size;

      // By event
      if (!stats.byEvent[eventName]) {
        stats.byEvent[eventName] = { count: 0, size: 0 };
      }
      stats.byEvent[eventName].count++;
      stats.byEvent[eventName].size += size;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error getting storage analytics:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      byStorageTier: {},
      byFileType: {},
      byEvent: {}
    };
  }
}

/**
 * Get local backup files
 */
async function getLocalBackupFiles() {
  const localFiles: any[] = [];
  
  try {
    const backupPath = process.env.LOCAL_BACKUP_PATH || './DSLR-System/Backup/dslr-backup';
    
    // Check if backup directory exists
    try {
      await fs.access(backupPath);
    } catch {
      return localFiles; // Directory doesn't exist
    }

    const scanDirectory = async (dirPath: string, relativePath: string = '') => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            // Add folder
            localFiles.push({
              id: `local-folder-${fullPath}`,
              name: entry.name,
              type: 'folder' as const,
              size: 0,
              modified: (await fs.stat(fullPath)).mtime.toISOString(),
              path: relativeFilePath,
              extension: '',
              isSelected: false,
              metadata: {
                storageProvider: 'local',
                isBackup: true
              }
            });
            
            // Recursively scan subdirectory
            await scanDirectory(fullPath, relativeFilePath);
          } else {
            // Add file
            const stats = await fs.stat(fullPath);
            localFiles.push({
              id: `local-file-${fullPath}`,
              name: entry.name,
              type: 'file' as const,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              path: relativeFilePath,
              extension: getFileExtension(entry.name),
              isSelected: false,
              metadata: {
                storageProvider: 'local',
                isBackup: true
              }
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error scanning directory ${dirPath}:`, error);
      }
    };

    await scanDirectory(backupPath);
  } catch (error) {
    console.error('❌ Error scanning local backup files:', error);
  }

  return localFiles;
}