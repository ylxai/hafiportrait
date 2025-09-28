/**
 * Cloudflare R2 Storage Integration
 * Provides 10GB free storage with S3-compatible API
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class CloudflareR2Storage {
  constructor(config = {}) {
    this.config = {
      // Cloudflare R2 credentials
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'hafiportrait-photos',
      
      // Custom domain (optional)
      customDomain: process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN,
      
      // Storage settings
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
      allowedTypes: config.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'],
      
      // Performance settings
      multipartThreshold: 25 * 1024 * 1024, // 25MB
      partSize: 10 * 1024 * 1024, // 10MB
      
      ...config
    };
    
    this.s3Client = null;
    this.isInitialized = false;
    this.endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;
  }

  /**
   * Initialize Cloudflare R2 client
   */
  async initialize() {
    try {
      if (!this.config.accountId || !this.config.accessKeyId || !this.config.secretAccessKey) {
        throw new Error('Missing Cloudflare R2 credentials');
      }

      this.s3Client = new S3Client({
        region: 'us-east-1',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        forcePathStyle: true,
        signatureVersion: 'v4',
      });

      this.isInitialized = true;
      console.log('✅ Cloudflare R2 client initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Cloudflare R2 initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Upload photo to Cloudflare R2
   */
  async uploadPhoto(photoBuffer, fileName, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate file path with folder structure
      const filePath = this.generateFilePath(fileName, metadata);
      
      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.config.bucketName,
        Key: filePath,
        Body: photoBuffer,
        ContentType: this.detectContentType(fileName),
        Metadata: {
          'event-id': metadata.eventId || 'unknown',
          'album-name': metadata.albumName || 'default',
          'uploader': metadata.uploaderName || 'system',
          'upload-timestamp': new Date().toISOString()
        }
      };

      // Add cache control for better performance
      uploadParams.CacheControl = 'public, max-age=31536000'; // 1 year

      // Upload to R2
      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);

      // Generate public URL
      const publicUrl = this.generatePublicUrl(filePath);

      console.log(`✅ Uploaded to Cloudflare R2: ${filePath}`);
      
      return {
        url: publicUrl,
        path: filePath,
        size: photoBuffer.length,
        storage: 'cloudflare-r2',
        etag: result.ETag,
        bucket: this.config.bucketName
      };
    } catch (error) {
      console.error('❌ Failed to upload to Cloudflare R2:', error);
      throw error;
    }
  }

  /**
   * Generate file path with folder structure
   */
  generateFilePath(fileName, metadata) {
    const { eventId, albumName, fileType } = metadata;
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    // Clean filename
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = cleanFileName.split('.').pop();
    const baseName = cleanFileName.replace(/\.[^/.]+$/, '');
    
    // Generate unique filename
    const uniqueFileName = `${timestamp}_${randomStr}_${baseName}.${fileExtension}`;
    
    // Create folder structure
    if (eventId && albumName) {
      return `events/${eventId}/${albumName}/${uniqueFileName}`;
    } else if (eventId) {
      return `events/${eventId}/${uniqueFileName}`;
    } else if (fileType === 'homepage') {
      return `homepage/${uniqueFileName}`;
    } else {
      return `uploads/${uniqueFileName}`;
    }
  }

  /**
   * Generate public URL for file
   */
  generatePublicUrl(filePath) {
    // Use custom domain if configured
    if (this.config.customDomain) {
      return `https://${this.config.customDomain}/${filePath}`;
    }
    // Use public URL from environment if set
    else if (process.env.CLOUDFLARE_R2_PUBLIC_URL) {
      return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${filePath}`;
    }
    // Default to R2 public URL
    else {
      return `https://pub-${this.config.accountId}.r2.dev/${filePath}`;
    }
  }

  /**
   * Detect content type from filename
   */
  detectContentType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Delete file from Cloudflare R2
   */
  async deleteFile(filePath) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const deleteParams = {
        Bucket: this.config.bucketName,
        Key: filePath
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);

      console.log(`✅ Deleted from Cloudflare R2: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete from Cloudflare R2:', error);
      return false;
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(prefix = '', maxKeys = 100) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const listParams = {
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const command = new ListObjectsV2Command(listParams);
      const result = await this.s3Client.send(command);

      return result.Contents?.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag,
        url: this.generatePublicUrl(file.Key)
      })) || [];
    } catch (error) {
      console.error('❌ Failed to list files from Cloudflare R2:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo() {
    try {
      // List all files to calculate usage
      const allFiles = await this.listFiles('', 1000);
      
      const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      const fileCount = allFiles.length;
      
      // R2 free tier: 10GB storage
      const freeLimit = 10 * 1024 * 1024 * 1024; // 10GB
      const available = freeLimit - totalSize;

      return {
        used: totalSize,
        limit: freeLimit,
        available: available,
        fileCount: fileCount,
        usedGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
        limitGB: (freeLimit / (1024 * 1024 * 1024)).toFixed(2),
        availableGB: (available / (1024 * 1024 * 1024)).toFixed(2),
        usagePercent: ((totalSize / freeLimit) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return null;
    }
  }

  /**
   * Generate presigned URL for direct upload
   */
  async generatePresignedUploadUrl(filePath, expiresIn = 3600) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: filePath
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      console.error('❌ Failed to generate presigned URL:', error);
      throw error;
    }
  }

  /**
   * Download photo from Cloudflare R2
   */
  async downloadPhoto(filePath) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const getParams = {
        Bucket: this.config.bucketName,
        Key: filePath
      };

      const command = new GetObjectCommand(getParams);
      const response = await this.s3Client.send(command);

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`❌ Failed to download photo ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Test connection and permissions
   */
  async testConnection() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Test by listing files (limited to 1)
      const testResult = await this.listFiles('', 1);
      
      console.log('✅ Cloudflare R2 connection test successful');
      console.log(`   Bucket: ${this.config.bucketName}`);
      console.log(`   Endpoint: ${this.endpoint}`);
      
      const storageInfo = await this.getStorageInfo();
      if (storageInfo) {
        console.log(`   Storage: ${storageInfo.usedGB}GB / ${storageInfo.limitGB}GB (${storageInfo.usagePercent}% used)`);
        console.log(`   Files: ${storageInfo.fileCount} files`);
      }

      return true;
    } catch (error) {
      console.error('❌ Cloudflare R2 connection test failed:', error);
      return false;
    }
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(files, metadata = {}) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadPhoto(file.buffer, file.name, {
          ...metadata,
          originalName: file.originalName
        });
        results.push(result);
      } catch (error) {
        errors.push({
          file: file.name,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: files.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }
}

module.exports = CloudflareR2Storage;
