# 📚 HafiPortrait API Documentation

## Overview
Dokumentasi lengkap untuk API endpoints HafiPortrait setelah perbaikan Smart Storage Manager.

**Version**: 1.0.0  
**Last Updated**: 2024-12-19  
**Base URL**: `https://your-domain.com/api`

---

## 🔄 Recent Updates (Smart Storage Manager Fixes)

### ✅ **File Upload Limit Increased**
- **Previous**: 10MB maximum file size
- **Current**: **50MB maximum file size** (5x increase)
- **Affected Endpoints**: All photo upload endpoints

### ✅ **Storage System Improvements**
- Multi-tier storage with automatic tier selection
- Accurate storage statistics using compressed file sizes
- Smart folder management per event
- Enhanced error handling and fallback mechanisms

---

## 📤 File Upload Endpoints

### 1. Upload Event Photo

```http
POST /api/events/{eventId}/photos
```

**Description**: Upload photos to a specific event using Smart Storage Manager

**Parameters**:
- `eventId` (path): Event ID where photo will be uploaded

**Form Data**:
- `file` (file, required): Image file to upload
- `uploaderName` (string, optional): Name of uploader (default: "Anonymous")
- `albumName` (string, required): Album category ("Official", "Tamu", "Bridesmaid")

**File Constraints**:
- **Maximum size**: 50MB ⚡ **(Updated from 10MB)**
- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **Processing**: Automatic compression and optimization

**Response**:
```json
{
  "id": "12345",
  "url": "https://storage.example.com/optimized/photo.jpg",
  "thumbnail_url": "https://storage.example.com/thumbnails/thumb_photo.jpg",
  "original_name": "IMG_001.jpg",
  "uploader_name": "John Doe",
  "album_name": "Tamu",
  "storage_tier": "cloudflareR2",
  "storage_provider": "cloudflare-r2",
  "compression_used": "standard",
  "file_size": 2048576,
  "uploaded_at": "2024-12-19T10:00:00Z"
}
```

**Storage Tier Selection**:
- **Tier 1 (cloudflareR2)**: Premium photos, homepage content (8GB limit)
- **Tier 2 (googleDrive)**: Standard photos, overflow content (12GB limit)
- **Tier 3 (local)**: Archive, emergency fallback (50GB limit)

---

### 2. Upload Homepage Photo

```http
POST /api/admin/photos/homepage
```

**Description**: Upload photos for homepage gallery using Smart Storage Manager

**Form Data**:
- `file` (file, required): Image file to upload

**File Constraints**:
- **Maximum size**: 50MB ⚡ **(Updated from 10MB)**
- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **Processing**: Premium compression (95% quality, 4000px max width)

**Response**:
```json
{
  "id": "67890",
  "url": "https://storage.example.com/homepage/hero_image.jpg",
  "thumbnail_url": "https://storage.example.com/thumbnails/thumb_hero.jpg",
  "original_name": "hero_image.jpg",
  "is_homepage": true,
  "storage_tier": "cloudflareR2",
  "storage_provider": "cloudflare-r2",
  "compression_used": "premium",
  "file_size": 3145728,
  "uploaded_at": "2024-12-19T10:00:00Z"
}
```

---

## 📊 Storage Analytics Endpoints

### 3. Get Storage Statistics

```http
GET /api/admin/storage/analytics
```

**Description**: Retrieve comprehensive storage analytics from Smart Storage Manager

**Response**:
```json
{
  "storageReport": {
    "cloudflareR2": {
      "used": "2.40 GB",
      "available": "8.00 GB",
      "usage": "30.0%",
      "status": "🟢 Good"
    },
    "googleDrive": {
      "used": "5.20 GB", 
      "available": "12.00 GB",
      "usage": "43.3%",
      "status": "🟢 Good"
    },
    "local": {
      "used": "12.80 GB",
      "available": "50.00 GB", 
      "usage": "25.6%",
      "status": "🟢 Good"
    }
  },
  "tierStats": {
    "cloudflareR2": {
      "count": 145,
      "totalSize": 2576980377
    },
    "googleDrive": {
      "count": 320,
      "totalSize": 5583741952
    },
    "local": {
      "count": 89,
      "totalSize": 13743895552
    }
  },
  "totalPhotosWithSmartStorage": 554,
  "recentUploads": [...]
}
```

### 4. Get Storage Health

```http
GET /api/admin/storage/health
```

**Description**: Check storage system health and connectivity

**Response**:
```json
{
  "status": "healthy",
  "providers": {
    "cloudflareR2": {
      "status": "connected",
      "available": true,
      "responseTime": 120
    },
    "googleDrive": {
      "status": "connected", 
      "available": true,
      "responseTime": 250
    },
    "local": {
      "status": "available",
      "available": true,
      "responseTime": 5
    }
  },
  "recommendation": "cloudflareR2"
}
```

---

## 🔍 Monitoring Endpoints

### 5. System Health Check

```http
GET /api/monitoring/health
```

**Description**: Comprehensive system health including storage metrics

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T10:00:00Z",
  "uptime": 604800000,
  "version": "1.0.0",
  "environment": "production",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 45,
      "details": "Connected to Supabase"
    },
    {
      "name": "storage",
      "status": "healthy", 
      "responseTime": 120,
      "details": {
        "providers": ["cloudflareR2", "googleDrive", "local"],
        "activeProvider": "cloudflareR2",
        "totalUsage": "20.4 GB / 70 GB"
      }
    }
  ],
  "metrics": {
    "totalChecks": 4,
    "healthyChecks": 4,
    "avgResponseTime": 89,
    "errorRate": 0
  }
}
```

---

## 🛡️ Error Handling

### Common Error Responses

#### File Too Large
```json
{
  "message": "File size must be less than 50MB",
  "error": "FILE_TOO_LARGE",
  "maxSize": 52428800
}
```

#### Invalid File Type
```json
{
  "message": "Only image files are allowed",
  "error": "INVALID_FILE_TYPE",
  "allowedTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"]
}
```

#### Storage Full
```json
{
  "message": "Storage quota exceeded",
  "error": "STORAGE_FULL",
  "details": "All storage tiers are at capacity"
}
```

#### Upload Failed
```json
{
  "message": "Failed to upload photo: Storage provider unavailable",
  "error": "UPLOAD_FAILED",
  "fallback": "Trying alternative storage provider"
}
```

---

## 🔧 Smart Storage Manager Features

### Automatic Tier Selection
1. **Priority 1**: Cloudflare R2 for premium content
2. **Priority 2**: Google Drive for standard content  
3. **Priority 3**: Local storage for archive/emergency

### Compression Levels
- **Premium** (95% quality, 4000px): Homepage, featured content
- **Standard** (85% quality, 2000px): Regular event photos
- **Thumbnail** (75% quality, 800px): Preview images

### Folder Organization
- **Event-based**: Auto-create/find folders per event ID
- **Type-based**: Separate folders for homepage, thumbnails
- **Fallback**: Root folder if event ID unavailable

### Error Recovery
- **Automatic Fallback**: Try next available storage tier
- **Retry Logic**: Multiple attempts with exponential backoff
- **Error Logging**: Detailed error tracking for debugging

---

## 📈 Performance Improvements

### Upload Performance
- **File Size**: Increased from 10MB to 50MB
- **Compression**: Smart compression based on content type
- **Storage**: Multi-tier automatic selection
- **Monitoring**: Real-time storage usage tracking

### Accuracy Improvements
- **Statistics**: Uses compressed file sizes for accurate metrics
- **Error Handling**: Proper error propagation and logging
- **Token Management**: Support for environment variables
- **Folder Management**: Smart folder creation and selection

---

## 🔗 Related Documentation

- [Smart Storage Manager Configuration](./SMART_STORAGE_CONFIG.md)
- [Monitoring Dashboard Guide](./MONITORING_GUIDE.md)
- [Error Recovery Procedures](./ERROR_RECOVERY.md)
- [Storage Optimization Tips](./STORAGE_OPTIMIZATION.md)

---

**Last Updated**: 2024-12-19  
**API Version**: 1.0.0  
**Smart Storage Manager**: v2.0.0 (Post-fixes)