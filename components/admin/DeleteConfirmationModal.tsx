'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useAdminToast } from '@/hooks/toast/useAdminToast';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  photoCount?: number;
  isPermanent?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  photoCount = 1,
  isPermanent = false,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useAdminToast();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    
    // Show loading toast
    const loadingToastId = toast.showLoading(
      isPermanent ? 'Menghapus permanen...' : 'Memindahkan ke trash...',
      { description: `${photoCount} foto sedang diproses` }
    );

    try {
      await onConfirm();
      
      // Update to success toast
      if (isPermanent) {
        toast.updateToast(
          loadingToastId,
          'success',
          `${photoCount} foto berhasil dihapus permanen`,
          { description: 'File telah dihapus dari server' }
        );
      } else {
        toast.updateToast(
          loadingToastId,
          'success',
          `${photoCount} foto dipindahkan ke Trash`,
          { description: 'Dapat di-restore dalam 30 hari' }
        );
      }
      
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      
      // Update to error toast
      toast.updateToast(
        loadingToastId,
        'error',
        'Gagal menghapus foto',
        { description: 'Silakan coba lagi atau hubungi support' }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center">
            <div className={`mr-3 rounded-full p-2 ${isPermanent ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${isPermanent ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700">{message}</p>
          
          {photoCount > 1 && (
            <p className="mt-2 font-semibold text-gray-900">
              {photoCount} photo{photoCount > 1 ? 's' : ''} akan dihapus.
            </p>
          )}

          {!isPermanent && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Info:</strong> Foto akan dipindahkan ke Trash dan bisa di-restore dalam 30 hari.
              </p>
            </div>
          )}

          {isPermanent && (
            <div className="mt-4 rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Peringatan:</strong> Ini akan menghapus foto secara permanen beserta semua thumbnails. 
                Tindakan ini tidak bisa dibatalkan!
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              isPermanent
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {isDeleting ? 'Menghapus...' : isPermanent ? 'Hapus Permanen' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
