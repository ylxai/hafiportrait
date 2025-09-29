'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedNotifications } from '@/hooks/use-unified-notifications';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUploadQueue } from '@/hooks/use-upload-queue';

interface PhotoUploadFormProps {
  eventId: string;
  albumName: string;
  disabled?: boolean;
}

export default function PhotoUploadForm({ eventId, albumName, disabled = false }: PhotoUploadFormProps) {
  const { toast } = useToast();
  const notifications = useUnifiedNotifications();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Upload states
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Upload queue integration
  const uploadQueue = useUploadQueue({
    eventId,
    autoStart: true,
    onComplete: (completedItems) => {
      console.log(`✅ Completed ${completedItems.length} uploads`);
    },
    onError: (errorItems) => {
      console.log(`❌ Failed ${errorItems.length} uploads`);
    }
  });

  // Photo upload mutation with mobile optimization
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validasi file
      if (!file.type.startsWith('image/')) {
        throw new Error('Hanya file gambar yang diperbolehkan');
      }

      // Mobile-specific file size limit
      const maxSize = isMobile ? 30 * 1024 * 1024 : 50 * 1024 * 1024; // 30MB for mobile, 50MB for desktop
      if (file.size > maxSize) {
        const maxSizeText = isMobile ? '30MB' : '50MB';
        throw new Error(`Ukuran file maksimal ${maxSizeText}`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaderName', uploaderName.trim() || 'Anonim');
      formData.append('albumName', albumName);

      // Mobile optimization: Add connection quality detection
      if (isMobile) {
        const connection = (navigator as any).connection;
        if (connection) {
          formData.append('connectionType', connection.effectiveType || 'unknown');
          formData.append('downlink', connection.downlink?.toString() || '0');
        }
      }

      const response = await apiRequest(
        'POST',
        `/api/events/${eventId}/photos`,
        formData
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload gagal');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // This is now handled in the batch upload function
      // Individual success handling moved to processFile function
    },
    onError: (error) => {
      // This is now handled in the batch upload function  
      // Individual error handling moved to processFile function
    },
  });

  // Fungsi untuk handle multiple file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const newFiles: File[] = Array.from(fileList);
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    // Mobile optimization: Limit concurrent files
    const maxFiles = isMobile ? 5 : 10;
    if (selectedFiles.length + newFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Terlalu Banyak File",
        description: `Maksimal ${maxFiles} file ${isMobile ? 'di mobile' : 'sekaligus'}`
      });
      return;
    }

    // Validasi setiap file
    newFiles.forEach(file => {
      // Validasi format file
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
        'image/heic', 'image/heif', 'image/gif', 'image/bmp'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(nef|cr2|arw|dng|raf)$/)) {
        notifications.upload.invalidFileType(file.name);
        return;
      }

      // Mobile-specific file size check
      const maxSize = isMobile ? 30 * 1024 * 1024 : 50 * 1024 * 1024;
      const maxSizeText = isMobile ? '30MB' : '50MB';
      
      if (file.size > maxSize) {
        notifications.upload.fileTooLarge(file.name, maxSizeText);
        return;
      }

      // File valid, tambahkan ke array
      validFiles.push(file);
      
      // Buat preview URL untuk gambar
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.push(url);
      } else {
        newPreviewUrls.push(''); // Placeholder untuk non-image
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      
      const fileText = validFiles.length === 1 ? '1 foto' : `${validFiles.length} foto`;
      notifications.info("Foto Dipilih", `${fileText} siap untuk diupload`);
    }
  };

  // Fungsi untuk queue-based upload dengan advanced management
  const handleQueueUpload = useCallback(() => {
    if (selectedFiles.length === 0) return;
    
    // Add files to upload queue
    uploadQueue.addFiles(selectedFiles, uploaderName.trim() || 'Anonim', albumName);
    
    // Clear selected files after adding to queue
    setTimeout(() => {
      handleClearAllFiles();
    }, 1000);
  }, [selectedFiles, uploaderName, albumName, uploadQueue]);

  // Fungsi untuk hapus file individual dari selection
  const handleRemoveFile = useCallback((index: number) => {
    const urlToRevoke = previewUrls[index];
    
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [previewUrls]);

  // Fungsi untuk clear semua files
  const handleClearAllFiles = useCallback(() => {
    // Revoke all preview URLs
    previewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    
    setSelectedFiles([]);
    setPreviewUrls([]);
    
    // Reset input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [previewUrls]);

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Nama Input - Di atas */}
      <div className={`flex ${isMobile ? 'gap-2' : 'gap-2'}`}>
        <Input
          type="text"
          placeholder="Nama Anda (opsional)"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          className={`flex-1 ${
            isMobile 
              ? 'h-10 px-3 text-base' 
              : 'text-base'
          }`}
          disabled={uploadPhotoMutation.isPending || disabled}
        />
        {uploaderName.trim() && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUploaderName("")}
            disabled={uploadPhotoMutation.isPending || disabled}
            className="px-3 h-10"
          >
            ✕
          </Button>
        )}
      </div>

      {/* File Selection Button */}
      <label className={`
        block w-full border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
        ${uploadPhotoMutation.isPending || disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }
        ${isMobile ? 'h-24' : 'h-20'}
      `}>
        <div className={`flex flex-col items-center justify-center text-center ${
          isMobile ? 'px-4 py-4' : 'pt-3 pb-3'
        }`}>
          <Camera 
            className={`mb-2 transition-colors ${
              isMobile ? 'w-6 h-6' : 'w-5 h-5'
            } ${
              uploadPhotoMutation.isPending || disabled
                ? 'text-gray-400' 
                : albumName === 'Tamu' ? 'text-wedding-rose' : 'text-wedding-sage'
            }`} 
          />
          <p className={`font-medium ${
            isMobile ? 'text-sm' : 'text-xs'
          } ${
            uploadPhotoMutation.isPending || disabled || uploadQueue.isProcessing ? 'text-gray-400' : 'text-gray-700'
          }`}>
            Pilih Foto {isMobile ? '(Multiple)' : '(Multiple File)'}
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, WEBP, HEIC, RAW (maks. {isMobile ? '30MB' : '50MB'})
            {isMobile && <span className="block mt-1 text-blue-600">📱 Mobile: Max {isMobile ? '5' : '10'} files, 2 concurrent</span>}
          </p>
        </div>
        <input
          type="file"
          accept="image/*,.nef,.cr2,.arw,.dng,.raf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadPhotoMutation.isPending || disabled || uploadQueue.isProcessing}
        />
      </label>

      {/* Preview dan Upload Button */}
      {selectedFiles.length > 0 && (
        <div className={`border rounded-lg p-3 bg-white ${isMobile ? 'space-y-3' : 'space-y-2'}`}>
          {/* Files Count Header */}
          <div className="flex items-center justify-between">
            <p className={`font-medium text-gray-800 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              {selectedFiles.length === 1 ? '1 foto dipilih' : `${selectedFiles.length} foto dipilih`}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAllFiles}
              disabled={uploadQueue.isProcessing}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Hapus Semua
            </Button>
          </div>

          {/* Files Grid - Mobile Optimized */}
          <div className={`grid gap-2 ${
            isMobile 
              ? selectedFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              : selectedFiles.length === 1 ? 'grid-cols-1' : selectedFiles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {selectedFiles.map((file, index) => {
              const progress = uploadQueue.getProgressByFile(file.name);
              const isUploading = progress > 0 && progress < 100;
              const isError = progress === -1;
              const isSuccess = progress === 100;
              
              return (
                <div key={`${file.name}-${index}`} className="relative border rounded-lg p-2 bg-gray-50">
                  {/* Preview Image */}
                  {previewUrls[index] && (
                    <div className="relative mb-2">
                      <img 
                        src={previewUrls[index]} 
                        alt={file.name}
                        className={`w-full rounded object-cover ${
                          isMobile ? 'h-20' : 'h-16'
                        }`}
                      />
                      
                      {/* Progress Overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                          <div className="text-white text-xs font-medium">
                            {progress}%
                          </div>
                        </div>
                      )}
                      
                      {/* Success Indicator */}
                      {isSuccess && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      
                      {/* Error Indicator */}
                      {isError && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✕</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="space-y-1">
                    <p className={`font-medium text-gray-800 truncate ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  {!uploadQueue.isProcessing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 bg-white/80 rounded-full"
                    >
                      ✕
                    </Button>
                  )}
                  
                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Upload Button */}
          <Button
            onClick={handleQueueUpload}
            disabled={uploadQueue.isProcessing || selectedFiles.length === 0}
            className={`w-full ${
              albumName === 'Tamu' 
                ? 'bg-rose-500 hover:bg-rose-600' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            } text-white ${isMobile ? 'h-12' : 'h-10'}`}
          >
            {uploadQueue.isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Menambah ke Queue...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>
                  Tambah ke Queue ({selectedFiles.length === 1 ? '1 foto' : `${selectedFiles.length} foto`})
                </span>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Upload Queue Status Display */}
      {!uploadQueue.isQueueEmpty && (
        <div className={`border rounded-lg p-3 bg-blue-50 border-blue-200 ${isMobile ? 'space-y-3' : 'space-y-2'}`}>
          {/* Queue Stats Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                uploadQueue.isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <p className={`font-medium text-blue-800 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                Upload Queue ({uploadQueue.stats.total} item{uploadQueue.stats.total !== 1 ? 's' : ''})
              </p>
            </div>
            
            {/* Queue Controls */}
            <div className="flex items-center gap-1">
              {uploadQueue.isProcessing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={uploadQueue.stopProcessing}
                  className="h-7 px-2 text-blue-600 hover:text-blue-700"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={uploadQueue.startProcessing}
                  disabled={!uploadQueue.stats.pending && !uploadQueue.stats.retrying}
                  className="h-7 px-2 text-blue-600 hover:text-blue-700"
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              
              {uploadQueue.canRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={uploadQueue.retryFailed}
                  className="h-7 px-2 text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={uploadQueue.clearCompleted}
                disabled={uploadQueue.stats.completed === 0}
                className="h-7 px-2 text-gray-600 hover:text-gray-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadQueue.stats.overallProgress}%` }}
            />
          </div>

          {/* Queue Statistics */}
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="text-xs">
              <div className="font-medium text-gray-600">{uploadQueue.stats.pending}</div>
              <div className="text-gray-500">Pending</div>
            </div>
            <div className="text-xs">
              <div className="font-medium text-blue-600">{uploadQueue.stats.uploading}</div>
              <div className="text-gray-500">Upload</div>
            </div>
            <div className="text-xs">
              <div className="font-medium text-green-600">{uploadQueue.stats.completed}</div>
              <div className="text-gray-500">Done</div>
            </div>
            <div className="text-xs">
              <div className="font-medium text-red-600">{uploadQueue.stats.failed}</div>
              <div className="text-gray-500">Failed</div>
            </div>
            <div className="text-xs">
              <div className="font-medium text-orange-600">{uploadQueue.stats.retrying}</div>
              <div className="text-gray-500">Retry</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}