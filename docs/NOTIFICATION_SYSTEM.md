# 🔔 Sistem Notifikasi Unified - HafiPortrait

## Overview
Sistem notifikasi yang telah diperbaiki untuk menghindari konflik dengan SocketIO dan sistem notifikasi lainnya.

## ✅ Perbaikan yang Dilakukan

### 1. **Konflik dan Duplikasi yang Diperbaiki:**
- ❌ **Dihapus**: `useAppNotifications` (duplikat)
- ❌ **Dihapus**: `NotificationExamples` (tidak diperlukan)
- ✅ **Dibuat**: `useUnifiedNotifications` (sistem utama)
- ✅ **Ditambahkan**: `Toaster` di `providers.tsx`

### 2. **Sistem Notifikasi yang Ada:**
- `useNotifications` - Firebase FCM + WebSocket (untuk browser notifications)
- `use-status-notifications` - Event status notifications (untuk admin)
- `useUnifiedNotifications` - Toast notifications (untuk UI feedback)
- `useSocketIORealtime` - Real-time notifications (SocketIO)

### 3. **Anti-Konflik Mechanism:**
```typescript
// Check untuk sistem yang sudah aktif
const hasExistingNotificationSystem = () => {
  return typeof window !== 'undefined' && 
         (window as any).__notificationSystemActive;
};

// Queue system untuk prevent spam
let notificationQueue: Array<NotificationData> = [];
```

## 🎯 Penggunaan

### Import dan Setup:
```typescript
import { useUnifiedNotifications } from '@/hooks/use-unified-notifications';

const notifications = useUnifiedNotifications();
```

### Event Management:
```typescript
notifications.event.created('Wedding Sarah & John');
notifications.event.updated('Wedding Sarah & John');
notifications.event.deleted('Wedding Sarah & John');
```

### Upload Management:
```typescript
notifications.upload.success('photo.jpg', 'Cloudflare R2');
notifications.upload.failed('photo.jpg', 'Connection timeout');
notifications.upload.fileTooLarge('large_photo.jpg', '50MB');
notifications.upload.invalidFileType('document.pdf');
```

### Photo Management:
```typescript
notifications.photo.deleted('photo.jpg');
notifications.photo.liked('photo.jpg');
```

### System Notifications:
```typescript
notifications.system.connectionError();
notifications.system.sessionExpired();
```

### Quick Access:
```typescript
notifications.success('Title', 'Description');
notifications.error('Title', 'Description');
notifications.warning('Title', 'Description');
notifications.info('Title', 'Description');
```

## 🔧 Fitur Anti-Konflik

### 1. **SocketIO Detection:**
```typescript
const isSocketIOContext = React.useMemo(() => {
  return typeof window !== 'undefined' && 
         ((window as any).__socketIOActive || (window as any).io);
}, []);
```

### 2. **Notification Queue:**
- Mencegah spam notifications
- Delay 300ms antar notifications
- Auto-processing queue

### 3. **Global State Check:**
- Deteksi sistem notifikasi yang sudah aktif
- Avoid double initialization
- Graceful degradation

## 📊 Komponen yang Sudah Diupdate

### ✅ Updated:
- `src/components/admin/EventForm.tsx`
- `src/components/event/PhotoUploadForm.tsx`
- `src/app/providers.tsx` (added Toaster)

### 🔄 Sistem yang Tetap Berjalan:
- SocketIO real-time notifications
- Firebase push notifications  
- Status notifications
- Admin notification center

## 🚫 Yang Harus Dihindari

### ❌ Jangan gunakan multiple toast systems:
```typescript
// JANGAN - konflik!
const { toast } = useToast();
const notifications = useNotifications(); // Firebase
const unified = useUnifiedNotifications();
```

### ✅ Gunakan satu sistem yang sesuai:
```typescript
// BENAR - untuk UI feedback
const notifications = useUnifiedNotifications();

// BENAR - untuk real-time data
const { notifications: socketNotifs } = useSocketIORealtime();
```

## 🎨 Toast Styling

Notifications menggunakan Radix UI Toast dengan styling:
- **Success**: ✅ Green with success icon
- **Error**: ❌ Red with error icon (destructive variant)
- **Warning**: ⚠️ Yellow with warning icon
- **Info**: ℹ️ Blue with info icon

## 🔍 Debugging

### Check Active Systems:
```javascript
// Browser console
console.log('Notification System Active:', window.__notificationSystemActive);
console.log('SocketIO Active:', window.__socketIOActive || !!window.io);
```

### Monitor Queue:
```javascript
// Hook internal queue monitoring
useEffect(() => {
  console.log('Notification queue length:', notificationQueue.length);
}, []);
```

## 📈 Performance

### Optimizations:
- **Queue system** prevents notification spam
- **React.useMemo** for expensive checks
- **React.useCallback** for stable functions
- **Conditional rendering** based on context

### Memory Management:
- Auto-cleanup completed notifications
- Queue size limit (prevent memory leaks)
- Proper event listener cleanup

---

**Status**: ✅ Sistem notifikasi telah diperbaiki dan tidak konflik dengan SocketIO
**Last Updated**: 2024-12-19