# Analisis Mekanisme Upload dan Penyimpanan File Hafiportrait

## Overview
Dokumen ini membahas secara rinci isu-isu pada mekanisme upload dan penyimpanan file dalam sistem Hafiportrait, termasuk keamanan, skalabilitas, dan efisiensi sistem penyimpanan.

## 1. Presigned URL Security Issues

### Deskripsi Masalah
Tidak ada batas waktu ketat pada presigned URLs dan tidak ada validasi tipe file sebelum memberikan URL.

### Lokasi Kode
- `/lib/storage/*`
- Upload services dan API routes terkait

### Penyebab
- Presigned URL bisa memiliki expiry time yang terlalu lama
- Tidak ada validasi ekstensi file sebelum membuat presigned URL
- Tidak ada batasan ukuran file pada tingkat presigned URL

### Dampak
- Potensi upload file berbahaya
- Expired URLs bisa disimpan dan digunakan nanti
- Resource abuse melalui presigned URLs

### Solusi Rekomendasi
```typescript
// Implementasi presigned URL yang aman
const createSecurePresignedUrl = async (
  fileName: string, 
  contentType: string, 
  eventId: string
) => {
  // Validasi input sebelum proses
  validateFileName(fileName);
  validateContentType(contentType);
  
  // Gunakan expiry time yang pendek
  const expiryTime = 15 * 60; // 15 minutes
  
  // Gunakan event-specific path untuk keamanan
  const key = `events/${eventId}/${Date.now()}_${sanitizeFileName(fileName)}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      'event-id': eventId,
      'uploaded-at': new Date().toISOString()
    }
  });
  
  const url = await getSignedUrl(s3Client, command, { expiresIn: expiryTime });
  
  // Simpan metadata sementara di database
  await prisma.pending_uploads.create({
    data: {
      key,
      event_id: eventId,
      expires_at: new Date(Date.now() + expiryTime * 1000),
      content_type: contentType
    }
  });
  
  return { url, key, expiry: expiryTime };
};

const validateFileName = (fileName: string) => {
  if (fileName.length > 255) {
    throw new Error('Filename too long');
  }
  
  const ext = path.extname(fileName).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  if (!allowedExts.includes(ext)) {
    throw new Error('Invalid file extension');
  }
};

const validateContentType = (contentType: string) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ];
  
  if (!allowedTypes.includes(contentType)) {
    throw new Error('Invalid content type');
  }
};
```

## 2. Tidak Ada Batas Upload Per User/Event

### Deskripsi Masalah
Tidak ada validasi total ukuran upload per user atau per event, pengguna bisa upload file sangat besar.

### Lokasi Kode
- Upload services
- API routes untuk upload

### Penyebab
- Tidak ada tracking total storage per event
- Tidak ada quota enforcement
- Tidak ada validasi total size sebelum upload

### Dampak
- Resource storage dan bandwidth habis
- Performance degradation
- Biaya operasional meningkat

### Solusi Rekomendasi
```typescript
// Implementasi storage quota per event
const validateStorageQuota = async (eventId: string, fileSize: number) => {
  // Hitung total storage yang digunakan
  const totalUsed = await prisma.photos.aggregate({
    where: { 
      event_id: eventId,
      deleted_at: null
    },
    _sum: { file_size: true }
  });
  
  const currentUsed = totalUsed._sum.file_size || 0;
  const maxStorage = getMaxStorageForEvent(eventId); // Bisa dari package user
  
  if (currentUsed + fileSize > maxStorage) {
    throw new Error('Storage quota exceeded for this event');
  }
  
  return true;
};

// Middleware untuk validasi sebelum upload
const storageQuotaMiddleware = async (req: NextApiRequest, eventId: string) => {
  const contentLength = req.headers['content-length'];
  if (!contentLength) {
    throw new Error('Content-Length header is required');
  }
  
  const fileSize = parseInt(contentLength);
  if (isNaN(fileSize)) {
    throw new Error('Invalid Content-Length header');
  }
  
  await validateStorageQuota(eventId, fileSize);
};
```

## 3. File Processing Tanpa Queue Mechanism

### Deskripsi Masalah
Tidak ada queue mechanism untuk file processing, bisa menjadi bottleneck.

### Lokasi Kode
- Image processing services
- Thumbnail generation
- EXIF data processing

### Penyebab
- File processing dilakukan inline
- Tidak ada background job processing
- Blocking operation bisa memperlambat response

### Dampak
- Response time tinggi
- Server resource exhaustion
- Potensi timeout pada upload besar

### Solusi Rekomendasi
```typescript
// Implementasi queue-based processing
interface ProcessImageJob {
  key: string;
  originalUrl: string;
  eventId: string;
  metadata?: Record<string, any>;
}

class ImageProcessingQueue {
  private queue: Bull.Queue<ProcessImageJob>;
  
  constructor() {
    this.queue = new Bull.Queue('image-processing', process.env.REDIS_URL);
    
    // Worker untuk proses gambar
    this.queue.process('process-image', async (job) => {
      const { key, originalUrl, eventId, metadata } = job.data;
      
      try {
        // Generate thumbnails
        await this.generateThumbnails(key, originalUrl);
        
        // Extract and sanitize EXIF data
        const exifData = await this.extractAndSanitizeExif(originalUrl);
        
        // Update database dengan status selesai
        await prisma.photos.update({
          where: { original_url: originalUrl },
          data: {
            processing_status: 'completed',
            thumbnail_urls: {
              small: `thumbnail_small_${key}`,
              medium: `thumbnail_medium_${key}`,
              large: `thumbnail_large_${key}`
            },
            exif_data: exifData
          }
        });
        
        // Notifikasi ke client via socket
        io.to(`event:${eventId}`).emit('photo:processing:complete', { key });
        
      } catch (error) {
        // Update status error dan log
        await prisma.photos.update({
          where: { original_url: originalUrl },
          data: { processing_status: 'failed', error_message: error.message }
        });
        
        // Notifikasi error
        io.to(`event:${eventId}`).emit('photo:processing:error', { key, error: error.message });
        
        throw error;
      }
    });
  }
  
  async addJob(jobData: ProcessImageJob) {
    return await this.queue.add('process-image', jobData, {
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: true,
      removeOnFail: 1000
    });
  }
}
```

## 4. EXIF Data Vulnerability Issues

### Deskripsi Masalah
Fungsi `exif-reader` bisa rentan terhadap image-based attacks dan EXIF data bisa mengandung informasi sensitif.

### Lokasi Kode
- `/lib/utils/exif.ts` (asumsi)
- File upload processing

### Penyebab
- Tidak ada sanitasi EXIF data
- Tidak ada proteksi terhadap malicious EXIF
- Informasi sensitif tidak disaring

### Dampak
- Potensi security exploitasi melalui EXIF
- Kebocoran informasi lokasi atau device
- File korup bisa crash sistem EXIF processing

### Solusi Rekomendasi
```typescript
import exifReader from 'exif-reader';
import { sanitizeExifData } from './exif-sanitizer';

// Fungsi aman untuk membaca EXIF
const safeExifRead = async (buffer: Buffer) => {
  try {
    // Validasi awal bahwa buffer adalah image valid
    const fileType = await import('file-type');
    const type = await fileType.fromBuffer(buffer);
    
    if (!type || !type.mime.startsWith('image/')) {
      throw new Error('File is not a valid image');
    }
    
    // Batasi ukuran file untuk EXIF processing
    if (buffer.length > 50 * 1024 * 1024) { // 50MB
      throw new Error('File too large for EXIF processing');
    }
    
    // Baca EXIF dengan timeout dan batasan
    const exifRaw = exifReader(buffer);
    
    // Sanitasi EXIF data
    const sanitizedExif = sanitizeExifData(exifRaw);
    
    return sanitizedExif;
  } catch (error) {
    // Log error tetapi jangan crash sistem
    console.error('EXIF processing error:', error);
    
    // Return data kosong jika EXIF bermasalah
    return {
      error: 'EXIF data could not be processed safely',
      original_error: error.message
    };
  }
};

// Sanitizer untuk EXIF data sensitif
const sanitizeExifData = (rawExif: any) => {
  const sanitized: any = {};
  
  // Hanya ambil field yang aman dan berguna
  const safeFields = ['DateTime', 'DateTimeOriginal', 'DateTimeDigitized', 'Orientation'];
  
  for (const [key, value] of Object.entries(rawExif)) {
    if (safeFields.includes(key)) {
      sanitized[key] = value;
    }
    
    // Jangan ambil GPS data untuk keamanan privasi
    if (key === 'GPSInfo') {
      console.warn('GPS data removed from EXIF for privacy');
      continue;
    }
  }
  
  return sanitized;
};
```

## 5. Tidak Ada Validasi Nama File dan Path

### Deskripsi Masalah
Nama file mungkin tidak disanitasi, bisa menyebabkan path traversal atau karakter tidak valid.

### Lokasi Kode
- File upload services
- Storage key generation

### Penyebab
- Tidak ada sanitasi nama file sebelum digunakan
- Tidak ada validasi karakter khusus
- Path traversal mungkin tidak dicegah

### Dampak
- Security exploitasi melalui path traversal
- Invalid file names bisa menyebabkan error
- File bisa disimpan di lokasi yang tidak diinginkan

### Solusi Rekomendasi
```typescript
// Sanitasi nama file yang aman
const sanitizeFileName = (fileName: string) => {
  // Hapus path traversal
  fileName = fileName.replace(/(\.\.\/)+/g, '');
  fileName = fileName.replace(/(\\|\/)+/g, '');
  
  // Ganti karakter tidak valid
  fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
  
  // Batasi panjang nama file
  const MAX_NAME_LENGTH = 200;
  if (fileName.length > MAX_NAME_LENGTH) {
    const ext = path.extname(fileName);
    const name = path.basename(fileName, ext);
    fileName = name.substring(0, MAX_NAME_LENGTH - ext.length) + ext;
  }
  
  return fileName;
};

// Validasi nama file setelah sanitasi
const validateSanitizedFileName = (sanitized: string) => {
  if (!sanitized || sanitized.trim() === '') {
    throw new Error('Invalid filename after sanitization');
  }
  
  // Pastikan ekstensi valid
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(sanitized).toLowerCase();
  
  if (!allowedExts.includes(ext)) {
    throw new Error(`Invalid file extension: ${ext}`);
  }
  
  return true;
};
```

## 6. Database Performance pada File Tracking

### Deskripsi Masalah
Tabel `photos` bisa menjadi sangat besar dan tidak ada optimasi query atau partitioning.

### Lokasi Kode
- `/prisma/schema.prisma`
- Query pada tabel photos

### Penyebab
- Tidak ada partitioning untuk tabel besar
- Tidak ada indexing optimal
- Query tidak dioptimasi untuk data besar

### Dampak
- Query performance degradation
- Database slow response
- Potensi memory issues

### Solusi Rekomendasi
```prisma
// Optimasi schema Prisma dengan indexing yang tepat
model photos {
  id               String   @id @default(uuid())
  filename         String
  original_url     String   @db.VarChar(255)
  thumbnail_url    String?  @db.VarChar(255)
  display_order    Int      @default(0)
  likes_count      Int      @default(0)
  created_at       DateTime @default(now()) @map("created_at")
  updated_at       DateTime @updatedAt
  event_id         String
  caption          String?
  deleted_at       DateTime?
  download_count   Int      @default(0)
  file_size        Int?
  height           Int?
  is_featured      Boolean  @default(false)
  mime_type        String?
  thumbnail_large_url   String?
  thumbnail_medium_url  String?
  thumbnail_small_url   String?
  uploaded_by_id   String?
  views_count      Int      @default(0)
  width            Int?
  exif_data        Json?
  
  @@index([event_id, created_at], name: "idx_photos_event_created")
  @@index([event_id, display_order], name: "idx_photos_event_order")
  @@index([is_featured, created_at], name: "idx_photos_featured_created")
  @@index([deleted_at], name: "idx_photos_deleted")
  @@index([created_at], name: "idx_photos_created")
}

// Query optimasi
const getPhotosForGallery = async (eventId: string, page: number = 1, limit: number = 50) => {
  const skip = (page - 1) * limit;
  
  return await prisma.photos.findMany({
    where: {
      event_id: eventId,
      deleted_at: null
    },
    select: {
      id: true,
      filename: true,
      original_url: true,
      thumbnail_url: true,
      likes_count: true,
      created_at: true,
      caption: true
    },
    orderBy: [
      { is_featured: 'desc' },
      { display_order: 'asc' },
      { created_at: 'desc' }
    ],
    skip,
    take: limit
  });
};
```

## 7. File Access dan Privacy Issues

### Deskripsi Masalah
Tidak jelas bagaimana validasi akses file dilakukan, file bisa diakses secara langsung dengan URL.

### Lokasi Kode
- File serving mechanism
- Private file access control

### Penyebab
- File storage mungkin public
- Tidak ada validasi akses sebelum serving file
- Hotlinking mungkin tidak dicegah

### Dampak
- Unauthorized access to private photos
- Bandwidth theft melalui hotlinking
- Privacy breach

### Solusi Rekomendasi
```typescript
// Implementasi secure file serving
const serveSecureFile = async (req: NextApiRequest, res: NextApiResponse, photoId: string) => {
  try {
    // Validasi akses ke foto
    const { user } = await getUserFromRequest(req);
    const photo = await prisma.photos.findUnique({
      where: { id: photoId },
      include: {
        events: true
      }
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Validasi akses ke event
    const hasAccess = await validateEventAccess(photo.event_id, user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Redirect ke URL aman dengan short-lived token
    const fileUrl = await generateSecureFileUrl(photo.original_url, 300); // 5 minutes expiry
    res.redirect(fileUrl);
    
  } catch (error) {
    console.error('Secure file serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware untuk proteksi hotlinking
const hotlinkProtection = (req: NextApiRequest) => {
  const referer = req.headers.referer;
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://hafiportrait.photography',
    'https://www.hafiportrait.photography'
  ];
  
  if (referer && !allowedOrigins.some(origin => referer.includes(origin))) {
    console.warn('Hotlinking attempt detected:', referer);
    return false;
  }
  
  return true;
};
```

## 8. Tidak Ada CDN dan Caching Strategy

### Deskripsi Masalah
Tidak ada konfigurasi caching yang jelas dan tidak ada CDN configuration.

### Lokasi Kode
- File serving logic
- Asset loading

### Penyebab
- Tidak ada HTTP caching headers
- File tidak di-cache secara efisien
- Tidak ada invalidation cache

### Dampak
- Bandwidth tinggi
- Performance degradation
- Biaya transfer data tinggi

### Solusi Rekomendasi
```typescript
// Implementasi caching headers
const addCacheHeaders = (res: NextApiResponse, fileType: string) => {
  // Set cache headers based on file type
  if (fileType.startsWith('image/')) {
    // Cache gambar untuk 1 tahun karena disimpan dengan content hash
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  } else {
    // Cache file lain untuk waktu lebih pendek
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  }
};

// CDN configuration
const getCDNUrl = (filePath: string) => {
  if (process.env.CDN_BASE_URL) {
    return `${process.env.CDN_BASE_URL}/${filePath}`;
  }
  
  // Fallback ke URL asli jika tidak ada CDN
  return filePath;
};

// Cache invalidation
const invalidateFileCache = async (fileUrl: string) => {
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CF_ZONE_ID) {
    // Contoh untuk Cloudflare
    await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [fileUrl]
      })
    });
  }
};
```

## 9. Error Handling pada Upload Process

### Deskripsi Masalah
Jika upload ke S3 gagal, tidak jelas bagaimana penanganan rollback dan tidak ada retry mechanism.

### Lokasi Kode
- Upload services
- Error handling dalam upload process

### Penyebab
- Tidak ada rollback mechanism
- Tidak ada retry logic
- Tidak ada fallback storage

### Dampak
- Data inconsistency
- Orphaned records di database
- User experience buruk

### Solusi Rekomendasi
```typescript
// Implementasi upload dengan rollback
const uploadPhotoWithRollback = async (photoData: PhotoUploadData) => {
  let photoRecord: any;
  
  try {
    // 1. Buat record sementara di database
    photoRecord = await prisma.photos.create({
      data: {
        ...photoData,
        processing_status: 'uploading',
        upload_started_at: new Date()
      }
    });
    
    // 2. Upload ke S3 dengan retry
    const uploadResult = await retryUploadToS3(photoData.buffer, photoData.key);
    
    // 3. Update status sukses
    await prisma.photos.update({
      where: { id: photoRecord.id },
      data: {
        processing_status: 'uploaded',
        original_url: uploadResult.url,
        file_size: uploadResult.size,
        uploaded_by_id: photoData.uploadedBy
      }
    });
    
    return photoRecord;
    
  } catch (error) {
    // Rollback: hapus record atau tandai error
    if (photoRecord) {
      await prisma.photos.update({
        where: { id: photoRecord.id },
        data: {
          processing_status: 'failed',
          error_message: error.message,
          upload_error_at: new Date()
        }
      });
    }
    
    // Log error untuk debugging
    console.error('Photo upload failed:', error, { photoId: photoRecord?.id });
    
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Retry logic untuk upload
const retryUploadToS3 = async (buffer: Buffer, key: string, maxRetries: number = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: detectMimeType(key)
      });
      
      const response = await s3Client.send(command);
      
      return {
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        size: buffer.length,
        etag: response.ETag
      };
      
    } catch (error) {
      lastError = error;
      console.warn(`Upload attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Tunggu sebelum retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};
```

## Rekomendasi Prioritas

**Prioritas Tinggi:**
1. Implementasi secure presigned URLs dengan batas waktu ketat
2. Tambahkan storage quota per event
3. Sanitasi nama file dan validasi path traversal
4. Implementasi file access validation

**Prioritas Menengah:**
1. Tambahkan queue mechanism untuk file processing
2. Implementasi EXIF data sanitization
3. Tambahkan CDN dan caching configuration
4. Perbaiki error handling dan rollback

**Prioritas Rendah:**
1. Database optimization untuk tabel photos besar
2. Hotlink protection
3. Cache invalidation mechanism
4. Advanced file type validation