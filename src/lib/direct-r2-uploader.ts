/**
 * Direct Cloudflare R2 Uploader - Simple & Fast
 * Replaces Smart Storage Manager for reliable single-tier storage
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { ImageFormatValidator } from './image-format-validator';
const GoogleDriveStorage = require('./google-drive-storage.js');

interface UploadOptions {
  eventId: string;
  file: File;
  uploaderName: string;
  albumName: string;
  compression?: {
    quality: number;
    maxWidth: number;
  };
}

interface UploadResult {
  id: string;
  url: string;
  thumbnail_url: string;
  original_name: string;
  uploader_name: string;
  album_name: string;
  file_size: number;
  storage_provider: string;
}

export class DirectR2Uploader {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;
  private googleDrive: any;

  constructor() {
    // Validate R2 credentials
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Cloudflare R2 credentials not configured. Check environment variables.');
    }

    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'hafiportrait-photos';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://photos.hafiportrait.photography';

    // Initialize S3 client for R2
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Initialize Google Drive for original backup
    try {
      this.googleDrive = new GoogleDriveStorage();
      console.log('✅ Google Drive backup initialized');
    } catch (error) {
      console.warn('⚠️ Google Drive backup not available:', error);
      this.googleDrive = null;
    }
  }

  /**
   * Upload photo directly to Cloudflare R2
   */
  async uploadPhoto(options: UploadOptions): Promise<UploadResult> {
    const { eventId, file, uploaderName, albumName } = options;

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);

      // Validate image format before processing
      const validation = await ImageFormatValidator.validateBuffer(originalBuffer, file.name, file.type);
      
      if (!validation.isValid) {
        throw new Error(ImageFormatValidator.getErrorMessage(validation, file.name));
      }

      if (!validation.canProcessWithSharp) {
        throw new Error(`Unsupported format: ${validation.format}. ${ImageFormatValidator.getErrorMessage(validation, file.name)}`);
      }

      console.log(`✅ Image validation passed: ${file.name} (${validation.format})`);

      // Process image with Sharp
      const { processedBuffer, finalSize } = await this.processImage(originalBuffer, file.name, options.compression);

      // Generate file paths
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      
      const imagePath = `events/${eventId}/${albumName}/${fileName}`;
      const thumbnailPath = `events/${eventId}/${albumName}/thumbnails/${fileName}`;

      // Upload main image to R2
      await this.uploadToR2(processedBuffer, imagePath, file.type);

      // Generate and upload thumbnail
      const thumbnailBuffer = await this.generateThumbnail(processedBuffer);
      await this.uploadToR2(thumbnailBuffer, thumbnailPath, 'image/jpeg');

      // Construct public URLs
      const imageUrl = `${this.publicUrl}/${imagePath}`;
      const thumbnailUrl = `${this.publicUrl}/${thumbnailPath}`;

      // Save to database
      const photoData = {
        event_id: eventId,
        url: imageUrl,
        thumbnail_url: thumbnailUrl,
        original_name: file.name,
        uploader_name: uploaderName,
        album_name: albumName,
        file_size: finalSize,
        original_file_size: originalBuffer.length,
        storage_provider: 'cloudflare-r2',
        is_homepage: false,
        filename: fileName,
      };

      const photo = await this.saveToDatabase(photoData);
      
      // Backup original to Google Drive (async, non-blocking)
      if (this.googleDrive) {
        this.backupOriginalToGoogleDrive(originalBuffer, fileName, eventId, albumName, photo.id)
          .catch(error => console.warn('⚠️ Google Drive backup failed:', error));
      }
      
      console.log(`✅ Photo uploaded successfully: ${fileName} (${(finalSize / 1024).toFixed(1)}KB)`);
      
      return photo;

    } catch (error) {
      console.error('❌ Direct R2 upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process image with compression
   */
  private async processImage(
    buffer: Buffer, 
    fileName: string, 
    compression?: { quality: number; maxWidth: number }
  ): Promise<{ processedBuffer: Buffer; finalSize: number }> {
    try {
      // Default compression settings
      const settings = compression || {
        quality: 90,
        maxWidth: 2400
      };

      // First, get image metadata to validate Sharp can read it
      let metadata;
      try {
        metadata = await sharp(buffer).metadata();
        console.log(`📊 Image metadata: ${metadata.format} ${metadata.width}x${metadata.height}`);
      } catch (metadataError) {
        throw new Error(`Cannot read image metadata: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`);
      }

      // Check if format is supported
      if (!metadata.format) {
        throw new Error('Unknown image format detected by Sharp');
      }

      // Process based on detected format
      let sharpProcessor = sharp(buffer);

      // AUTO-ROTATE: Handle EXIF orientation (fixes portrait/landscape issues)
      if (metadata.orientation && metadata.orientation > 1) {
        console.log(`🔄 Auto-rotating image: orientation ${metadata.orientation}`);
        sharpProcessor = sharpProcessor.rotate(); // Auto-rotate based on EXIF
      }

      // Apply resize if needed
      if (settings.maxWidth && metadata.width && metadata.width > settings.maxWidth) {
        sharpProcessor = sharpProcessor.resize(settings.maxWidth, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        });
      }

      // Convert to JPEG for consistent output (except for PNG with transparency)
      if (metadata.format === 'png' && metadata.channels === 4) {
        // Keep PNG format for transparency
        sharpProcessor = sharpProcessor.png({ 
          quality: settings.quality,
          progressive: true
        });
      } else {
        // Convert to JPEG for better compression
        sharpProcessor = sharpProcessor.jpeg({ 
          quality: settings.quality,
          progressive: true,
          mozjpeg: true
        });
      }

      const processedBuffer = await sharpProcessor.toBuffer();

      console.log(`✅ Image processed: ${metadata.format} → JPEG, ${buffer.length} → ${processedBuffer.length} bytes`);

      return {
        processedBuffer,
        finalSize: processedBuffer.length
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('❌ Image processing failed:', errorMessage);
      
      // Don't fallback to original if Sharp explicitly failed - this means format is unsupported
      if (errorMessage.includes('Input buffer contains unsupported image format') || 
          errorMessage.includes('Cannot read image metadata')) {
        throw new Error(`Image processing failed: ${errorMessage}. Please use a standard image format (JPEG, PNG, WebP).`);
      }
      
      // For other errors, fallback to original
      console.warn('⚠️ Using original file due to processing error');
      return {
        processedBuffer: buffer,
        finalSize: buffer.length
      };
    }
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate() // Auto-rotate thumbnail based on EXIF too
        .resize(400, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 80,
          progressive: true
        })
        .toBuffer();
    } catch (error) {
      console.warn('⚠️ Thumbnail generation failed:', error);
      // Return smaller version of original as fallback
      return await sharp(buffer)
        .resize(400, null, { withoutEnlargement: true })
        .toBuffer();
    }
  }

  /**
   * Upload buffer to R2
   */
  private async uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });

    await this.s3Client.send(command);
  }

  /**
   * Save photo data to database
   */
  private async saveToDatabase(photoData: any): Promise<UploadResult> {
    try {
      // Use Supabase admin client
      const { data: photo, error } = await supabaseAdmin
        .from('photos')
        .insert(photoData)
        .select()
        .single();

      if (error) {
        throw new Error(`Database save failed: ${error.message}`);
      }

      return photo;
    } catch (error) {
      console.error('❌ Database save failed:', error);
      throw error;
    }
  }

  /**
   * Upload homepage photo
   */
  async uploadHomepagePhoto(options: { 
    file: File; 
    compression?: { quality: number; maxWidth: number } 
  }): Promise<UploadResult> {
    try {
      // Convert File to Buffer
      const arrayBuffer = await options.file.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);

      // Validate image format before processing
      const validation = await ImageFormatValidator.validateBuffer(originalBuffer, options.file.name, options.file.type);
      
      if (!validation.isValid) {
        throw new Error(ImageFormatValidator.getErrorMessage(validation, options.file.name));
      }

      if (!validation.canProcessWithSharp) {
        throw new Error(`Unsupported format: ${validation.format}. ${ImageFormatValidator.getErrorMessage(validation, options.file.name)}`);
      }

      console.log(`✅ Homepage image validation passed: ${options.file.name} (${validation.format})`);

      // Process image with Sharp
      const { processedBuffer, finalSize } = await this.processImage(originalBuffer, options.file.name, options.compression);

      // Generate file paths for homepage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = options.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      
      const imagePath = `homepage/${fileName}`;
      const thumbnailPath = `homepage/thumbnails/${fileName}`;

      // Upload main image to R2
      await this.uploadToR2(processedBuffer, imagePath, options.file.type);

      // Generate and upload thumbnail
      const thumbnailBuffer = await this.generateThumbnail(processedBuffer);
      await this.uploadToR2(thumbnailBuffer, thumbnailPath, 'image/jpeg');

      // Construct public URLs
      const imageUrl = `${this.publicUrl}/${imagePath}`;
      const thumbnailUrl = `${this.publicUrl}/${thumbnailPath}`;

      // Save to database
      const photoData = {
        url: imageUrl,
        thumbnail_url: thumbnailUrl,
        original_name: options.file.name,
        uploader_name: 'Admin',
        album_name: 'Homepage',
        file_size: finalSize,
        storage_provider: 'cloudflare-r2',
        is_homepage: true,
        filename: fileName,
      };

      const photo = await this.saveToDatabase(photoData);
      
      console.log(`✅ Homepage photo uploaded successfully: ${fileName} (${(finalSize / 1024).toFixed(1)}KB)`);
      
      return photo;

    } catch (error) {
      console.error('❌ Homepage photo upload failed:', error);
      throw new Error(`Homepage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test R2 connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a small upload
      const testBuffer = Buffer.from('test-connection');
      const testKey = 'test/connection-test.txt';
      
      await this.uploadToR2(testBuffer, testKey, 'text/plain');
      
      console.log('✅ Cloudflare R2 connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Cloudflare R2 connection test failed:', error);
      return false;
    }
  }

  /**
   * Backup original photo to Google Drive (async)
   */
  private async backupOriginalToGoogleDrive(
    originalBuffer: Buffer, 
    fileName: string, 
    eventId: string, 
    albumName: string, 
    photoId: string
  ): Promise<void> {
    try {
      console.log(`📤 Starting Google Drive backup for: ${fileName}`);
      
      // Create folder structure: Events/{EventName}/{Album}/
      const folderPath = `Events/${eventId}/${albumName}`;
      
      // Upload original file to Google Drive
      const uploadResult = await this.googleDrive.uploadPhoto(
        originalBuffer,
        fileName,
        folderPath,
        {
          mimeType: 'image/jpeg', // Default mime type
          originalName: fileName
        }
      );
      
      if (uploadResult && uploadResult.webViewLink) {
        // Update database with Google Drive backup URL
        await this.updatePhotoBackupUrl(photoId, uploadResult.webViewLink);
        console.log(`✅ Google Drive backup completed: ${fileName}`);
      } else {
        throw new Error('No backup URL returned from Google Drive');
      }
      
    } catch (error) {
      console.error(`❌ Google Drive backup failed for ${fileName}:`, error);
      // Don't throw error - backup failure should not affect main upload
    }
  }

  /**
   * Update photo with Google Drive backup URL
   */
  private async updatePhotoBackupUrl(photoId: string, backupUrl: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('photos')
        .update({ google_drive_backup_url: backupUrl })
        .eq('id', photoId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('❌ Failed to update photo backup URL:', error);
    }
  }
}

// Export singleton instance
export const directR2Uploader = new DirectR2Uploader();