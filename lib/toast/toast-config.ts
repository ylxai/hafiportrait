/**
 * Toast Configuration
 * Centralized configuration untuk toast notifications
 * Optimized untuk photography business admin dashboard
 */

export const TOAST_CONFIG = {
  // Position optimized untuk mobile admin
  position: 'top-center' as const,
  
  // Duration settings
  duration: {
    success: 4000,      // 4 detik untuk success messages
    error: 6000,        // 6 detik untuk error messages (lebih lama untuk dibaca)
    warning: 5000,      // 5 detik untuk warnings
    info: 3500,         // 3.5 detik untuk info
    loading: Infinity,  // Loading tetap sampai di-dismiss
  },
  
  // Visual settings
  theme: 'light' as const,
  richColors: true,
  closeButton: true,
  expand: true,
  visibleToasts: 3,
  
  // Mobile-specific
  mobile: {
    position: 'top-center' as const,
    swipeToDismiss: true,
  },
  
  // Icons - photography themed
  icons: {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    loading: '⏳',
  },
} as const

// Toast message templates untuk consistency
export const TOAST_MESSAGES = {
  // Authentication
  auth: {
    loginSuccess: 'Berhasil login! Selamat datang kembali',
    loginError: 'Login gagal. Periksa username dan password',
    logoutSuccess: 'Berhasil logout. Sampai jumpa!',
    sessionExpired: 'Sesi telah berakhir. Silakan login kembali',
    unauthorized: 'Akses ditolak. Silakan login sebagai admin',
  },
  
  // Event Management
  event: {
    createSuccess: (name: string) => `Event "${name}" berhasil dibuat!`,
    createError: 'Gagal membuat event. Silakan coba lagi',
    updateSuccess: (name: string) => `Event "${name}" berhasil diupdate`,
    updateError: 'Gagal mengupdate event',
    deleteConfirm: (name: string, photoCount: number) => 
      `Hapus event "${name}"? ${photoCount} foto akan ikut terhapus`,
    deleteSuccess: (name: string) => `Event "${name}" berhasil dihapus`,
    deleteError: 'Gagal menghapus event',
    qrGenerateSuccess: 'QR code berhasil dibuat!',
    qrGenerateError: 'Gagal generate QR code',
    statusChangeSuccess: (status: string) => `Status event diubah ke ${status}`,
  },
  
  // Photo Management
  photo: {
    uploadStart: (count: number) => `Uploading ${count} foto...`,
    uploadProgress: (current: number, total: number) => 
      `Uploading... ${current}/${total} foto`,
    uploadSuccess: (count: number) => 
      `${count} foto berhasil diupload! 🎉`,
    uploadError: (filename: string) => `Gagal upload "${filename}"`,
    uploadFileSizeError: (filename: string, maxSize: string) => 
      `"${filename}" terlalu besar. Maksimal ${maxSize}`,
    uploadFileTypeError: (filename: string) => 
      `"${filename}" format tidak didukung. Gunakan JPG/PNG/WebP`,
    deleteSuccess: (count: number) => 
      `${count} foto dipindahkan ke Trash`,
    deletePermanentConfirm: (count: number) => 
      `Hapus permanen ${count} foto? Tindakan ini tidak bisa dibatalkan!`,
    deletePermanentSuccess: (count: number) => 
      `${count} foto berhasil dihapus permanen`,
    restoreSuccess: (count: number) => `${count} foto berhasil di-restore`,
    setCoverSuccess: 'Cover photo berhasil diset',
    metadataUpdateSuccess: 'Metadata foto berhasil diupdate',
    reorderSuccess: 'Urutan foto berhasil disimpan',
    optimizingStart: (count: number) => `Optimizing ${count} foto untuk web...`,
  },
  
  // Package Management
  package: {
    createSuccess: (name: string) => `Paket "${name}" berhasil dibuat`,
    updateSuccess: (name: string) => `Paket "${name}" berhasil diupdate`,
    deleteSuccess: (name: string) => `Paket "${name}" berhasil dihapus`,
    deleteError: 'Gagal menghapus paket',
    toggleActiveSuccess: (name: string, is_active: boolean) => 
      `Paket "${name}" ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
    toggleBestSellerSuccess: (name: string, isBest: boolean) => 
      `${isBest ? '⭐' : ''} "${name}" ${isBest ? 'ditandai sebagai Best Seller' : 'Best Seller dihapus'}`,
  },
  
  // Category Management
  category: {
    createSuccess: (name: string) => `Kategori "${name}" berhasil dibuat`,
    updateSuccess: (name: string) => `Kategori "${name}" berhasil diupdate`,
    deleteSuccess: (name: string) => `Kategori "${name}" berhasil dihapus`,
    deleteError: (hasPackages: boolean) => 
      hasPackages 
        ? 'Kategori memiliki paket. Hapus paket terlebih dahulu'
        : 'Gagal menghapus kategori',
  },
  
  // Messages/Client Management
  message: {
    statusUpdateSuccess: (status: string) => `Status diubah ke ${status}`,
    deleteSuccess: 'Pesan berhasil dihapus',
    replySuccess: (clientName: string) => `Balasan terkirim ke ${clientName}`,
    whatsappOpenSuccess: (phone: string) => `Membuka WhatsApp ke ${phone}...`,
    emailCopySuccess: 'Email berhasil dicopy ke clipboard',
  },
  
  // Landing Page Management
  hero: {
    uploadSuccess: (count: number) => `${count} gambar berhasil diupload ke hero slideshow`,
    deleteSuccess: 'Gambar berhasil dihapus dari hero slideshow',
    reorderSuccess: 'Urutan slideshow berhasil disimpan',
    settingsUpdateSuccess: 'Pengaturan slideshow berhasil diupdate',
  },
  
  bentoGrid: {
    updateSuccess: 'Bento grid berhasil diupdate',
    imageUploadSuccess: 'Gambar bento grid berhasil diupload',
  },
  
  portfolio: {
    uploadSuccess: (count: number) => `${count} foto portfolio berhasil diupload`,
    deleteSuccess: 'Foto portfolio berhasil dihapus',
    updateSuccess: 'Portfolio berhasil diupdate',
  },
  
  // Form Submissions
  formSubmission: {
    statusUpdateSuccess: 'Status form submission berhasil diupdate',
    deleteSuccess: 'Form submission berhasil dihapus',
  },
  
  // Additional Services
  additionalService: {
    createSuccess: (name: string) => `Layanan "${name}" berhasil ditambahkan`,
    updateSuccess: (name: string) => `Layanan "${name}" berhasil diupdate`,
    deleteSuccess: (name: string) => `Layanan "${name}" berhasil dihapus`,
  },
  
  // Comments
  comment: {
    approveSuccess: (count: number) => `${count} komentar berhasil disetujui`,
    rejectSuccess: (count: number) => `${count} komentar berhasil ditolak`,
    deleteSuccess: (count: number) => `${count} komentar berhasil dihapus`,
  },
  
  // Generic Messages
  generic: {
    saveSuccess: 'Perubahan berhasil disimpan',
    saveError: 'Gagal menyimpan perubahan',
    loadError: 'Gagal memuat data',
    networkError: 'Koneksi bermasalah. Periksa internet Anda',
    validationError: 'Data tidak valid. Periksa form Anda',
    copySuccess: 'Berhasil dicopy ke clipboard',
    downloadSuccess: 'Download berhasil',
    downloadError: 'Gagal mendownload file',
  },
  
  // API Errors
  apiError: {
    400: 'Request tidak valid',
    401: 'Sesi berakhir. Silakan login kembali',
    403: 'Akses ditolak',
    404: 'Data tidak ditemukan',
    422: 'Data tidak valid. Periksa input Anda',
    429: 'Terlalu banyak request. Tunggu sebentar',
    500: 'Server error. Tim teknis sedang menangani',
    503: 'Server sedang maintenance',
  },
} as const

export type ToastPosition = typeof TOAST_CONFIG.position
export type ToastTheme = typeof TOAST_CONFIG.theme
