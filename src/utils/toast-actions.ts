/**
 * Toast notification utilities for admin actions
 * Provides consistent toast messages for CRUD operations
 */

import { globalToast } from '@/components/admin/global-toast-provider';

export const toastActions = {
  // Event actions
  eventCreated: (eventName: string) => {
    globalToast.success('Event Berhasil Dibuat!', `Event "${eventName}" telah ditambahkan.`);
  },
  
  eventUpdated: (eventName: string) => {
    globalToast.success('Event Berhasil Diupdate!', `Event "${eventName}" telah diperbarui.`);
  },
  
  eventDeleted: (eventName: string) => {
    globalToast.success('Event Berhasil Dihapus!', `Event "${eventName}" telah dihapus.`);
  },
  
  eventStatusChanged: (eventName: string, newStatus: string) => {
    const statusLabels = {
      'active': 'Diaktifkan',
      'completed': 'Diselesaikan', 
      'paused': 'Dijeda',
      'cancelled': 'Dibatalkan',
      'archived': 'Diarsipkan',
      'draft': 'Dijadikan Draft'
    };
    
    const label = statusLabels[newStatus as keyof typeof statusLabels] || newStatus;
    globalToast.success(`Event ${label}!`, `Event "${eventName}" berhasil ${label.toLowerCase()}.`);
  },

  // Photo actions
  photoUploaded: (count: number = 1) => {
    globalToast.success('Upload Berhasil!', `${count} foto berhasil diupload.`);
  },
  
  photoDeleted: (fileName?: string) => {
    globalToast.success('Foto Berhasil Dihapus!', fileName ? `Foto "${fileName}" telah dihapus.` : 'Foto telah dihapus.');
  },
  
  photosAddedToSlideshow: (count: number) => {
    globalToast.success('Ditambahkan ke Slideshow!', `${count} foto ditambahkan ke slideshow.`);
  },
  
  photoRemovedFromSlideshow: () => {
    globalToast.success('Dihapus dari Slideshow!', 'Foto berhasil dihapus dari slideshow.');
  },

  // Pricing actions
  packageCreated: (packageName: string) => {
    globalToast.success('Paket Berhasil Dibuat!', `Paket "${packageName}" telah ditambahkan.`);
  },
  
  packageUpdated: (packageName: string) => {
    globalToast.success('Paket Berhasil Diupdate!', `Paket "${packageName}" telah diperbarui.`);
  },
  
  packageDeleted: (packageName: string) => {
    globalToast.success('Paket Berhasil Dihapus!', `Paket "${packageName}" telah dihapus.`);
  },
  
  packageReordered: () => {
    globalToast.success('Urutan Berhasil Diubah!', 'Posisi paket telah diupdate.');
  },

  // System actions
  backupCompleted: (eventName?: string) => {
    globalToast.success('Backup Berhasil!', eventName ? `Backup event "${eventName}" selesai.` : 'Backup data selesai.');
  },
  
  syncCompleted: (count: number) => {
    globalToast.success('Sync Berhasil!', `${count} item berhasil disinkronisasi.`);
  },
  
  settingsSaved: () => {
    globalToast.success('Pengaturan Tersimpan!', 'Konfigurasi berhasil disimpan.');
  },

  // Error actions
  uploadFailed: (reason?: string) => {
    globalToast.error('Upload Gagal!', reason || 'Terjadi kesalahan saat upload. Silakan coba lagi.');
  },
  
  deleteFailed: (reason?: string) => {
    globalToast.error('Hapus Gagal!', reason || 'Terjadi kesalahan saat menghapus. Silakan coba lagi.');
  },
  
  saveFailed: (reason?: string) => {
    globalToast.error('Simpan Gagal!', reason || 'Terjadi kesalahan saat menyimpan. Silakan coba lagi.');
  },
  
  networkError: () => {
    globalToast.error('Koneksi Bermasalah!', 'Periksa koneksi internet Anda dan coba lagi.');
  },

  // Warning actions
  storageAlmostFull: (percentage: number) => {
    globalToast.warning('Storage Hampir Penuh!', `Penggunaan storage sudah ${percentage}%. Pertimbangkan untuk cleanup.`);
  },
  
  eventOverdue: (eventName: string, days: number) => {
    globalToast.warning('Event Sudah Lewat!', `Event "${eventName}" sudah lewat ${days} hari. Pertimbangkan untuk menyelesaikan.`);
  },

  // Info actions
  autoStatusTriggered: (action: string, count: number) => {
    globalToast.info(`Auto ${action} Dijalankan`, `${count} event berhasil diproses otomatis.`);
  },
  
  maintenanceMode: () => {
    globalToast.info('Mode Maintenance', 'Sistem sedang dalam mode maintenance. Beberapa fitur mungkin terbatas.');
  },

  // Loading actions
  uploading: (fileName?: string) => {
    return globalToast.loading('Mengupload...', fileName ? `Mengupload "${fileName}"` : 'Sedang mengupload file...');
  },
  
  processing: (action: string) => {
    return globalToast.loading('Memproses...', `Sedang ${action.toLowerCase()}...`);
  },
  
  syncing: () => {
    return globalToast.loading('Sinkronisasi...', 'Sedang menyinkronkan data...');
  }
};

// Helper function to handle API responses with automatic toast
export const handleApiResponse = async <T>(
  apiCall: () => Promise<Response>,
  successMessage: string,
  errorMessage?: string
): Promise<T | null> => {
  try {
    const response = await apiCall();
    
    if (response.ok) {
      const data = await response.json();
      globalToast.success('Berhasil!', successMessage);
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      globalToast.error('Gagal!', errorMessage || errorData.message || 'Terjadi kesalahan.');
      return null;
    }
  } catch (error) {
    console.error('API Error:', error);
    globalToast.error('Koneksi Bermasalah!', 'Periksa koneksi internet Anda.');
    return null;
  }
};

// Helper for form submissions
export const handleFormSubmission = async <T>(
  formData: any,
  submitFunction: (data: any) => Promise<T>,
  successMessage: string,
  errorMessage?: string
): Promise<T | null> => {
  const loadingId = globalToast.loading('Menyimpan...', 'Sedang memproses data...');
  
  try {
    const result = await submitFunction(formData);
    globalToast.success('Berhasil!', successMessage);
    return result;
  } catch (error: any) {
    console.error('Form submission error:', error);
    globalToast.error('Gagal!', errorMessage || error.message || 'Terjadi kesalahan saat menyimpan.');
    return null;
  }
};