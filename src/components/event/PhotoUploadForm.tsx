'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';

interface PhotoUploadFormProps {
  eventId: string;
  albumName: string;
  disabled?: boolean;
}

export default function PhotoUploadForm({ eventId, albumName, disabled = false }: PhotoUploadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Upload states
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validasi file
      if (!file.type.startsWith('image/')) {
        throw new Error('Hanya file gambar yang diperbolehkan');
      }

      if (file.size > 15 * 1024 * 1024) {
        throw new Error('Ukuran file maksimal 15MB');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaderName', uploaderName.trim() || 'Anonim');
      formData.append('albumName', albumName);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'photos'] });
      
      const uploaderDisplayName = uploaderName.trim() || 'Anonim';
      toast({
        title: "Foto Berhasil Diupload!",
        description: `Foto berhasil ditambahkan ke album ${albumName} oleh ${uploaderDisplayName}.`,
      });
      
      // Reset selected file dan preview
      handleRemoveSelectedFile();
    },
    onError: (error) => {
      toast({
        title: "Upload Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat upload",
        variant: "destructive",
      });
    },
  });

  // Fungsi untuk handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi format file yang lebih lengkap
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/heic', 'image/heif', 'image/gif', 'image/bmp',
      // RAW formats
      'image/x-nikon-nef', 'image/x-canon-cr2', 'image/x-sony-arw',
      'image/x-adobe-dng', 'image/x-fuji-raf'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(nef|cr2|arw|dng|raf)$/)) {
      toast({
        title: "Format File Tidak Didukung",
        description: "Gunakan format: JPG, PNG, WEBP, HEIC, HEIF, GIF, BMP, NEF, CR2, ARW, DNG, RAF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File Terlalu Besar",
        description: "Ukuran file maksimal 15MB.",
        variant: "destructive",
      });
      return;
    }

    // Set selected file dan buat preview
    setSelectedFile(file);
    
    // Buat preview URL untuk gambar
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    toast({
      title: "Foto Dipilih",
      description: `${file.name} siap untuk diupload`,
    });
  };

  // Fungsi untuk upload foto yang sudah dipilih
  const handleUploadSelectedFile = () => {
    if (!selectedFile) return;
    
    uploadPhotoMutation.mutate(selectedFile);
  };

  // Fungsi untuk hapus file yang dipilih
  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    // Reset input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

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
            uploadPhotoMutation.isPending || disabled ? 'text-gray-400' : 'text-gray-700'
          }`}>
            Pilih Foto
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, WEBP, HEIC, RAW (maks. 15MB)
          </p>
        </div>
        <input
          type="file"
          accept="image/*,.nef,.cr2,.arw,.dng,.raf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadPhotoMutation.isPending || disabled}
        />
      </label>

      {/* Preview dan Upload Button */}
      {selectedFile && (
        <div className={`border rounded-lg p-3 bg-white ${isMobile ? 'space-y-3' : 'space-y-2'}`}>
          <div className="flex items-start gap-3">
            {/* Thumbnail Preview */}
            {previewUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className={`rounded object-cover ${
                    isMobile ? 'w-16 h-16' : 'w-12 h-12'
                  }`}
                />
              </div>
            )}
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-gray-800 truncate ${
                isMobile ? 'text-sm' : 'text-xs'
              }`}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            
            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveSelectedFile}
              disabled={uploadPhotoMutation.isPending}
              className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
          
          {/* Upload Button */}
          <Button
            onClick={handleUploadSelectedFile}
            disabled={uploadPhotoMutation.isPending}
            className={`w-full ${
              albumName === 'Tamu' 
                ? 'bg-wedding-rose hover:bg-wedding-rose/90' 
                : 'bg-wedding-sage hover:bg-wedding-sage/90'
            } text-white ${isMobile ? 'h-11' : 'h-10'}`}
          >
            {uploadPhotoMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Mengupload...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload Foto</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}