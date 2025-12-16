'use client';

/**
 * Photo Uploader Component dengan Toast Notifications
 * 
 * Drag-and-drop photo upload interface with:
 * - Multi-file selection
 * - Preview grid
 * - Progress tracking dengan toast
 * - Error handling dengan toast feedback
 * - Mobile support
 */

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAdminToast } from '@/hooks/toast/useAdminToast';
import { showFileValidationError } from '@/lib/toast/toast-utils';

// Accepted file types - moved outside component to be stable
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface PhotoUploaderProps {
  eventId: string;
  eventName: string;
  onUploadComplete?: (results: any) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export default function PhotoUploader({
  eventId,
  eventName,
  onUploadComplete,
  maxFiles = 500,
  maxFileSize = 50 * 1024 * 1024, // 50MB
}: PhotoUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useAdminToast();

  /**
   * Validate file
   */
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `File type ${file.type} not supported. Use JPG, PNG, or WebP.`;
    }
    
    if (file.size > maxFileSize) {
      const maxMB = maxFileSize / 1024 / 1024;
      const fileMB = file.size / 1024 / 1024;
      return `File size ${fileMB.toFixed(2)}MB exceeds maximum ${maxMB}MB.`;
    }
    
    return null;
  }, [maxFileSize]);

  /**
   * Add files to upload queue
   */
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check total files limit
    if (files.length + fileArray.length > maxFiles) {
      toast.updateToast(
        'max-files-error',
        'error',
        `Maksimal ${maxFiles} file`,
        { description: `Saat ini: ${files.length}, Menambahkan: ${fileArray.length}` }
      );
      return;
    }

    const uploadFiles: UploadFile[] = fileArray.map((file) => {
      const error = validateFile(file);
      
      // Show validation error toast untuk setiap file yang invalid
      if (error) {
        if (error.includes('size')) {
          showFileValidationError(file.name, 'size', `${maxFileSize / 1024 / 1024}MB`);
        } else {
          showFileValidationError(file.name, 'type');
        }
      }
      
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
      } as UploadFile;
    });

    setFiles((prev) => [...prev, ...uploadFiles]);
    
    // Show success toast untuk valid files
    const validFiles = uploadFiles.filter(f => !f.error);
    if (validFiles.length > 0) {
      toast.generic.saveSuccess();
    }
  }, [files.length, maxFiles, maxFileSize, toast, validateFile]);

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  /**
   * Remove file from queue
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  /**
   * Clear all files
   */
  const clearAll = useCallback(() => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    toast.generic.saveSuccess();
  }, [files, toast]);

  /**
   * Upload all files dengan toast progress
   */
  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast.updateToast('no-files', 'warning', 'Tidak ada file untuk diupload');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: pendingFiles.length });

    // Show loading toast
    const uploadToastId = toast.photo.uploadStart(pendingFiles.length);

    // Upload in batches of 5
    const batchSize = 5;
    let completed = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      
      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          batch.find((b) => b.id === f.id)
            ? { ...f, status: 'uploading' as const }
            : f
        )
      );

      // Upload batch
      const uploadPromises = batch.map(async (uploadFile) => {
        try {
          const formData = new FormData();
          formData.append('files', uploadFile.file);

          const response = await fetch(`/api/admin/events/${eventId}/photos/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: 'success' as const, progress: 100 }
                  : f
              )
            );
            successCount++;
            return { success: true };
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );
          errorCount++;
          
          // Show individual error toast
          toast.photo.uploadError(uploadFile.file.name);
          
          return { success: false };
        }
      });

      await Promise.all(uploadPromises);
      completed += batch.length;
      
      // Update progress toast
      toast.updateToast(
        uploadToastId,
        'info',
        `Uploading... ${completed}/${pendingFiles.length} foto`,
        { description: `${successCount} berhasil, ${errorCount} gagal` }
      );
      
      setUploadProgress({ current: completed, total: pendingFiles.length });
    }

    setIsUploading(false);

    // Show final result toast
    if (errorCount === 0) {
      toast.updateToast(
        uploadToastId,
        'success',
        `${successCount} foto berhasil diupload! 🎉`,
        { description: `Semua foto berhasil ditambahkan ke event "${eventName}"` }
      );
    } else if (successCount > 0) {
      toast.updateToast(
        uploadToastId,
        'warning',
        `Upload selesai dengan beberapa error`,
        { description: `${successCount} berhasil, ${errorCount} gagal` }
      );
    } else {
      toast.updateToast(
        uploadToastId,
        'error',
        'Upload gagal',
        { description: `Semua ${errorCount} file gagal diupload` }
      );
    }

    // Callback
    if (onUploadComplete) {
      onUploadComplete({
        total: pendingFiles.length,
        success: successCount,
        failed: errorCount,
      });
    }

    // Clear successful uploads after delay
    setTimeout(() => {
      setFiles((prev) => prev.filter((f) => f.status !== 'success'));
    }, 3000);
  }, [files, eventId, eventName, onUploadComplete, toast]);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const successCount = files.filter((f) => f.status === 'success').length;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-brand-teal bg-brand-teal/5 scale-[1.02]'
            : 'border-gray-300 hover:border-brand-teal hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-400'}
          `}>
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {isDragging ? 'Drop files here' : 'Upload Photos'}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop atau click untuk pilih file
            </p>
            <p className="text-xs text-gray-400 mt-2">
              JPG, PNG, WebP • Max {maxFileSize / 1024 / 1024}MB per file • Max {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {files.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{files.length}</span>
              <span className="text-gray-600 ml-1">Total</span>
            </div>
            {pendingCount > 0 && (
              <div>
                <span className="font-semibold text-blue-600">{pendingCount}</span>
                <span className="text-gray-600 ml-1">Pending</span>
              </div>
            )}
            {successCount > 0 && (
              <div>
                <span className="font-semibold text-green-600">{successCount}</span>
                <span className="text-gray-600 ml-1">Success</span>
              </div>
            )}
            {errorCount > 0 && (
              <div>
                <span className="font-semibold text-red-600">{errorCount}</span>
                <span className="text-gray-600 ml-1">Error</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="btn btn-secondary text-sm"
            >
              Clear All
            </button>
            <button
              onClick={uploadAll}
              disabled={isUploading || pendingCount === 0}
              className="btn btn-primary text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading... ({uploadProgress.current}/{uploadProgress.total})
                </>
              ) : (
                `Upload ${pendingCount} Photos`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
            >
              <Image
                src={file.preview}
                alt={file.file.name}
                fill
                className="object-cover"
              />

              {/* Status Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                <p className="text-white text-xs truncate flex-1">
                  {file.file.name}
                </p>
              </div>

              {/* Status Icon */}
              <div className="absolute top-2 right-2">
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                {file.status === 'uploading' && (
                  <div className="p-1 bg-white rounded-full shadow-lg">
                    <Loader2 className="w-4 h-4 text-brand-teal animate-spin" />
                  </div>
                )}
                {file.status === 'success' && (
                  <div className="p-1 bg-green-500 rounded-full shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                {file.status === 'error' && (
                  <div className="p-1 bg-red-500 rounded-full shadow-lg" title={file.error}>
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {file.status === 'uploading' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-brand-teal transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
