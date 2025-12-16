# Upload Progress Persistence - Implementation Guide

## Overview

Upload Progress Persistence adalah fitur yang memungkinkan photographer untuk melanjutkan upload foto bahkan setelah menutup browser atau mengalami gangguan jaringan. Fitur ini menggunakan localStorage dan Service Worker untuk menyimpan state upload dan melanjutkan dari titik terakhir.

## Key Features

### 1. Upload State Persistence
- **Automatic State Saving**: Progress upload otomatis tersimpan ke localStorage
- **Session Management**: Setiap batch upload memiliki unique session ID
- **Progress Tracking**: Menyimpan progress percentage, uploaded bytes, dan status per file
- **Storage Quota Management**: Monitor dan cleanup localStorage untuk mencegah quota exceeded

### 2. Network Recovery
- **Online/Offline Detection**: Real-time monitoring menggunakan `navigator.onLine`
- **Auto Pause/Resume**: Upload otomatis pause saat offline dan resume saat online
- **Connection Quality**: Deteksi kualitas koneksi (2G, 3G, 4G) jika tersedia
- **Visual Feedback**: Banner dan indicator untuk menampilkan status koneksi

### 3. Retry Logic
- **Exponential Backoff**: Retry dengan delays yang meningkat: 1s → 2s → 4s → 8s → 16s → 30s (max)
- **Max Retries**: Default 10 attempts sebelum mark sebagai permanently failed
- **Automatic Retry**: Failed uploads otomatis di-retry tanpa intervensi user
- **Manual Retry**: User dapat manually retry failed uploads via "Coba Lagi" button

### 4. Upload Queue Management
- **Concurrent Uploads**: Max 3 concurrent uploads (configurable)
- **Queue Persistence**: Queue state tersimpan di localStorage
- **Individual Control**: Pause, resume, atau cancel individual files
- **Batch Control**: Control entire batch dengan single action
- **Clear Completed**: Remove completed files dari queue untuk cleanup

### 5. Resume Capability
- **Pending Detection**: Detect pending uploads saat page load
- **Resume Banner**: Tampilkan banner dengan info pending uploads
- **Progress Restoration**: Restore exact progress dari localStorage
- **File Validation**: Validate file existence dan integrity sebelum resume

### 6. Upload History
- **Recent Uploads**: Track last 20 upload sessions
- **Auto Cleanup**: History older than 7 days otomatis dihapus
- **Session Details**: File count, total size, dan timestamp per session
- **Clear History**: Manual cleanup via "Hapus Riwayat" button

## Architecture

### Core Components

```
lib/upload/
├── uploadPersistence.ts      # localStorage management
├── uploadQueue.ts            # Queue dan retry logic
├── uploadQueueIntegrated.ts  # Integration dengan API
├── uploadService.ts          # XMLHttpRequest upload
├── checksumUtils.ts          # File integrity verification
└── serviceWorkerRegistration.ts

hooks/
└── useNetworkStatus.ts       # Network monitoring hook

components/upload/
├── ConnectionStatus.tsx      # Connection indicator
├── ResumeUploadBanner.tsx    # Resume prompt
└── UploadHistoryPanel.tsx    # History display

components/admin/
└── PhotoUploaderPersistent.tsx  # Main uploader component

public/
└── sw.js                     # Service Worker
```

### Data Flow

```
User selects files
    ↓
Validate files
    ↓
Create UploadSession
    ↓
Save to localStorage
    ↓
Add to UploadQueue
    ↓
Start uploading (max 3 concurrent)
    ↓
On progress: Update localStorage
    ↓
On complete: Mark as completed
    ↓
On error: Retry with exponential backoff
    ↓
All complete: Save to history, clear session
```

### localStorage Schema

```typescript
// Session Key: hafiportrait_upload_session
{
  sessionId: string;
  eventId: string;
  files: [
    {
      id: string;
      file: { name, size, type, lastModified };
      progress: number;
      status: 'queued' | 'uploading' | 'completed' | 'failed' | 'paused';
      uploadedChunks: number[];
      totalChunks: number;
      checksum?: string;
      error?: string;
      retryCount: number;
      lastRetry?: number;
      uploadedBytes?: number;
    }
  ];
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
}

// History Key: hafiportrait_upload_history
[
  {
    sessionId: string;
    eventId: string;
    completedAt: number;
    fileCount: number;
    totalSize: number;
  }
]
```

## Usage

### Basic Usage

```tsx
import PhotoUploaderPersistent from '@/components/admin/PhotoUploaderPersistent';

<PhotoUploaderPersistent
  eventId={event.id}
  eventName={event.name}
  onUploadComplete={(results) => {
    console.log('Upload complete:', results);
    // results: { success: number, error: number, total: number }
  }}
  maxFiles={500}
  maxFileSize={50 * 1024 * 1024} // 50MB
/>
```

### Testing Page

Test page tersedia di:
```
/admin/events/[eventId]/upload-persistent
```

### Configuration Options

```typescript
// Upload Queue Options
{
  maxConcurrent: 3,        // Max concurrent uploads
  maxRetries: 10,          // Max retry attempts
  chunkSize: 5242880,      // 5MB chunks (future)
  onProgress: (fileId, progress, bytes) => {},
  onFileComplete: (fileId) => {},
  onFileError: (fileId, error) => {},
  onQueueComplete: () => {},
  onStatusChange: (status) => {},
  onRetrying: (fileId, attempt, delay) => {},
}
```

## Browser Compatibility

### Required Features
- ✅ localStorage (IE 8+, All modern browsers)
- ✅ XMLHttpRequest Level 2 (IE 10+, All modern browsers)
- ✅ navigator.onLine (IE 9+, All modern browsers)

### Optional Enhancements
- 🔶 Service Worker (Chrome 40+, Firefox 44+, Safari 11.1+)
- 🔶 Network Information API (Chrome 61+, limited support)
- 🔶 BroadcastChannel (Chrome 54+, Firefox 38+, Safari 15.4+)

### Graceful Degradation
- Jika localStorage tidak available: Fallback ke normal upload (no persistence)
- Jika Service Worker tidak support: Upload tetap berfungsi tanpa background sync
- Jika Network Information API tidak available: Basic online/offline detection only

## Performance Considerations

### localStorage Usage
- **State Compression**: Completed files di-compress untuk save space
- **Debounced Writes**: Progress updates di-debounce (max 1 write per 500ms)
- **Quota Monitoring**: Check storage usage setiap 5 operations
- **Auto Cleanup**: Old sessions (>7 days) dan history otomatis dihapus

### Upload Performance
- **Concurrent Limit**: Max 3 concurrent uploads untuk optimal performance
- **Progress Tracking**: Efficient byte-level tracking
- **Memory Management**: File blobs tidak disimpan di localStorage, hanya metadata

### UI Performance
- **Virtual Scrolling**: Recommended untuk >100 files (future enhancement)
- **Debounced Updates**: UI updates di-batch untuk reduce re-renders
- **Lazy Loading**: History data loaded on-demand

## Security Considerations

### Data Safety
- ✅ No sensitive data in localStorage (file metadata only)
- ✅ Session IDs are unique dan unpredictable
- ✅ Checksum verification untuk file integrity
- ✅ File validation sebelum upload

### Recommendations
- 🔒 Clear localStorage on user logout
- 🔒 Implement rate limiting untuk retry attempts
- 🔒 Validate file types dan sizes server-side
- 🔒 Sanitize file metadata sebelum storage

## Testing

### Unit Tests
```bash
npm test -- __tests__/upload/uploadPersistence.test.ts
npm test -- __tests__/upload/uploadQueue.test.ts
```

### Manual Testing Scenarios

1. **Upload Resume Test**
   - Upload beberapa file
   - Close browser sebelum complete
   - Reopen browser
   - Verify: Resume banner muncul dengan correct file count

2. **Network Recovery Test**
   - Start upload
   - Disable network (DevTools > Network > Offline)
   - Verify: Uploads pause, connection banner shows
   - Enable network
   - Verify: Uploads resume automatically

3. **Retry Logic Test**
   - Mock API untuk return error
   - Start upload
   - Verify: Files retry dengan increasing delays
   - After 10 retries: Mark as failed

4. **Storage Quota Test**
   - Upload large number of files (>500)
   - Monitor localStorage size
   - Verify: Auto cleanup when quota > 80%

## Troubleshooting

### Issue: Resume banner tidak muncul
**Solution**: 
- Check browser console untuk errors
- Verify localStorage available: `localStorage.getItem('hafiportrait_upload_session')`
- Clear localStorage dan retry: `localStorage.clear()`

### Issue: Upload tidak resume otomatis saat online
**Solution**:
- Check network detection: `navigator.onLine`
- Verify useNetworkStatus hook loaded
- Check browser console untuk connection events

### Issue: localStorage quota exceeded
**Solution**:
- Clear old sessions: Call `cleanupOldSessions()`
- Reduce number of concurrent files
- Clear completed files lebih frequently

### Issue: Progress tidak tersimpan
**Solution**:
- Verify localStorage available dan writable
- Check browser privacy settings (localStorage might be disabled)
- Try incognito/private mode untuk testing

## Future Enhancements

### Planned Features
1. **Chunked Upload**: Resume individual files dari specific chunk
2. **BroadcastChannel**: Cross-tab coordination untuk prevent duplicates
3. **IndexedDB**: Store larger metadata dan thumbnail previews
4. **Virtual Scrolling**: Better performance untuk large file lists
5. **Server-side Resume**: Support resumable uploads via Range headers
6. **Compression**: Compress images before upload untuk save bandwidth
7. **Progress Sync**: Real-time progress sync across devices

### API Enhancements
1. Chunked upload endpoint: `POST /api/admin/events/[id]/photos/upload-chunk`
2. Resume capability: `POST /api/admin/events/[id]/photos/resume-upload`
3. Checksum verification: Server-side validation
4. Session management: Track upload sessions di database

## Support

Untuk issues atau questions:
1. Check browser console untuk errors
2. Review this documentation
3. Check test files untuk examples
4. Contact development team

---

**Version**: 1.0  
**Last Updated**: 2024-12-13  
**Author**: Dev Agent (James)
