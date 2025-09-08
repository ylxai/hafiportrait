/**
 * Google Drive Storage Integration
 * Provides 15GB free storage for photo backup
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleDriveStorage {
  constructor(config = {}) {
    this.config = {
      // Google Drive API credentials (from Google Cloud Console)
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      
      // Storage settings
      rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      folderStructure: config.folderStructure || 'event-based', // 'event-based' or 'date-based'
      
      // File settings
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
      allowedTypes: config.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'],
      
      ...config
    };
    
    this.drive = null;
    this.auth = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Google Drive API
   */
  async initialize() {
    try {
      // Check if credentials are available
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Google Drive credentials not configured. Please set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in .env.local');
      }

      // Setup OAuth2 client
      this.auth = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      // Try to load saved tokens if available
      try {
        await this.loadTokens();
      } catch (tokenError) {
        console.log('⚠️ No saved tokens found, authentication will be required');
      }
      
      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      this.isInitialized = true;
      console.log('✅ Google Drive API initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Google Drive initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Load saved authentication tokens
   */
  async loadTokens() {
    try {
      // First try to use refresh token from environment
      const refreshToken = this.getRefreshTokenFromFile();
      if (refreshToken) {
        console.log('✅ Using refresh token from environment');
        this.auth.setCredentials({
          refresh_token: refreshToken
        });
        return;
      }

      // Fallback to file-based tokens
      const tokenPath = './google-drive-tokens.json';
      const tokenData = await fs.readFile(tokenPath, 'utf8');
      const tokens = JSON.parse(tokenData);
      
      this.auth.setCredentials(tokens);
      console.log('✅ Google Drive tokens loaded from file');
    } catch (error) {
      console.log('⚠️ No saved tokens found, authentication required');
      throw new Error('Authentication required. Run: node storage-optimization-cli.js auth');
    }
  }

  /**
   * Save authentication tokens
   */
  async saveTokens(tokens) {
    try {
      const tokenPath = './google-drive-tokens.json';
      await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
      console.log('✅ Google Drive tokens saved');
    } catch (error) {
      console.error('❌ Failed to save tokens:', error);
    }
  }

  /**
   * Get authentication URL for initial setup
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file'  // Only this scope (no verification required)
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Complete authentication with authorization code
   */
  async authenticate(code) {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      await this.saveTokens(tokens);
      
      console.log('✅ Google Drive authentication completed');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  /**
   * Create folder structure for event
   */
  async createEventFolder(eventId, eventName) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create main event folder
      const folderMetadata = {
        name: `${eventName} (${eventId})`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: this.config.rootFolderId ? [this.config.rootFolderId] : undefined
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      // Create subfolders
      const subfolders = ['Official', 'Tamu', 'Bridesmaid', 'RAW', 'Thumbnails'];
      const subfolderIds = {};

      for (const subfolder of subfolders) {
        const subfolderMetadata = {
          name: subfolder,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folder.data.id]
        };

        const sub = await this.drive.files.create({
          resource: subfolderMetadata,
          fields: 'id, name'
        });

        subfolderIds[subfolder] = sub.data.id;
      }

      console.log(`✅ Created Google Drive folder: ${folder.data.name}`);
      
      return {
        folderId: folder.data.id,
        folderName: folder.data.name,
        webViewLink: folder.data.webViewLink,
        subfolders: subfolderIds
      };
    } catch (error) {
      console.error('❌ Failed to create event folder:', error);
      throw error;
    }
  }

  /**
   * Upload photo to Google Drive
   */
  async uploadPhoto(photoBuffer, fileName, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Determine target folder
      const folderId = await this.getTargetFolderId(metadata);
      
      // Prepare file metadata
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
        description: `Uploaded from DSLR system - Event: ${metadata.eventId || 'Unknown'}`
      };

      // Upload file
      const media = {
        mimeType: 'image/jpeg',
        body: require('stream').Readable.from(photoBuffer)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, size, webViewLink, webContentLink'
      });

      // Make file publicly viewable (optional)
      if (metadata.makePublic) {
        await this.drive.permissions.create({
          fileId: file.data.id,
          resource: {
            role: 'reader',
            type: 'anyone'
          }
        });
      }

      console.log(`✅ Uploaded to Google Drive: ${fileName}`);
      
      return {
        fileId: file.data.id,
        fileName: file.data.name,
        size: file.data.size,
        webViewLink: file.data.webViewLink,
        webContentLink: file.data.webContentLink,
        publicUrl: metadata.makePublic ? `https://drive.google.com/uc?id=${file.data.id}` : null
      };
    } catch (error) {
      console.error('❌ Failed to upload to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Get target folder ID based on metadata
   */
  async getTargetFolderId(metadata) {
    const { eventId, albumName, fileType } = metadata;
    
    // For now, return root folder or event-specific folder
    // In production, you'd maintain a mapping of event folders
    return this.config.rootFolderId;
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const about = await this.drive.about.get({
        fields: 'storageQuota, user'
      });

      const quota = about.data.storageQuota;
      const used = parseInt(quota.usage || 0);
      const limit = parseInt(quota.limit || 15 * 1024 * 1024 * 1024); // 15GB default
      const available = limit - used;

      return {
        used: used,
        limit: limit,
        available: available,
        usedGB: (used / (1024 * 1024 * 1024)).toFixed(2),
        limitGB: (limit / (1024 * 1024 * 1024)).toFixed(2),
        availableGB: (available / (1024 * 1024 * 1024)).toFixed(2),
        usagePercent: ((used / limit) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return null;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.drive.files.list({
        q: query,
        pageSize: options.pageSize || 100,
        fields: 'files(id, name, size, createdTime, webViewLink, thumbnailLink)',
        orderBy: options.orderBy || 'createdTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('❌ Failed to list files:', error);
      return [];
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.drive.files.delete({ fileId });
      console.log(`✅ Deleted file from Google Drive: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(folderName, parentFolderId = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : (this.config.rootFolderId ? [this.config.rootFolderId] : undefined)
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      console.log(`✅ Created Google Drive folder: ${folderName}`);
      
      return {
        id: folder.data.id,
        name: folder.data.name,
        webViewLink: folder.data.webViewLink
      };
    } catch (error) {
      console.error(`❌ Failed to create folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Upload file to specific folder
   */
  async uploadToFolder(photoBuffer, fileName, folderId, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Prepare file metadata
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
        description: metadata.description || `Backup photo - ${fileName}`
      };

      // Upload file
      const media = {
        mimeType: 'image/jpeg',
        body: require('stream').Readable.from(photoBuffer)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, size, webViewLink, webContentLink'
      });

      // Make file publicly viewable
      await this.drive.permissions.create({
        fileId: file.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      console.log(`✅ Uploaded to Google Drive folder: ${fileName}`);
      
      return {
        fileId: file.data.id,
        fileName: file.data.name,
        size: file.data.size,
        webViewLink: file.data.webViewLink,
        webContentLink: file.data.webContentLink,
        publicUrl: `https://drive.google.com/uc?id=${file.data.id}`
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName} to folder:`, error);
      throw error;
    }
  }

  /**
   * Download photo from Google Drive
   */
  async downloadPhoto(fileId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`❌ Failed to download photo ${fileId}:`, error);
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

      // Test by getting user info
      const about = await this.drive.about.get({
        fields: 'user, storageQuota'
      });

      console.log('✅ Google Drive connection test successful');
      console.log(`   User: ${about.data.user.displayName}`);
      console.log(`   Email: ${about.data.user.emailAddress}`);
      
      const storageInfo = await this.getStorageInfo();
      if (storageInfo) {
        console.log(`   Storage: ${storageInfo.usedGB}GB / ${storageInfo.limitGB}GB (${storageInfo.usagePercent}% used)`);
      }

      return true;
    } catch (error) {
      console.error('❌ Google Drive connection test failed:', error);
      return false;
    }
  }
}

module.exports = GoogleDriveStorage;