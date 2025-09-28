'use client';

import { useToast, toast } from '@/components/ui/toast-notification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ToastDemo() {
  const { addToast } = useToast();

  const showSuccessToast = () => {
    addToast(toast.success(
      'Upload Berhasil!',
      'DSC_1234.jpg berhasil diupload ke album Official',
      {
        action: {
          label: 'Lihat Foto',
          onClick: () => console.log('Navigate to photo')
        }
      }
    ));
  };

  const showErrorToast = () => {
    addToast(toast.error(
      'Upload Gagal',
      'Koneksi internet terputus. Silakan coba lagi.',
      {
        persistent: true,
        action: {
          label: 'Retry',
          onClick: () => console.log('Retry upload')
        }
      }
    ));
  };

  const showWarningToast = () => {
    addToast(toast.warning(
      'Storage Hampir Penuh',
      'Tersisa 15% storage. Backup foto lama segera.',
      {
        duration: 8000
      }
    ));
  };

  const showInfoToast = () => {
    addToast(toast.info(
      'Event Dimulai',
      'Wedding Sarah & John akan dimulai dalam 30 menit'
    ));
  };

  const showUploadToast = () => {
    addToast(toast.upload(
      'Mengupload Foto',
      '5 foto sedang diupload ke album Official...',
      {
        duration: 3000
      }
    ));
  };

  const showCameraToast = () => {
    addToast(toast.camera(
      'Kamera Terhubung',
      'Nikon D7100 berhasil terhubung dan siap digunakan'
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toast Notification Demo</CardTitle>
        <CardDescription>
          Test berbagai jenis notifikasi real-time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button 
            onClick={showSuccessToast}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            ✅ Success
          </Button>
          
          <Button 
            onClick={showErrorToast}
            variant="destructive"
          >
            ❌ Error
          </Button>
          
          <Button 
            onClick={showWarningToast}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            ⚠️ Warning
          </Button>
          
          <Button 
            onClick={showInfoToast}
            variant="secondary"
          >
            ℹ️ Info
          </Button>
          
          <Button 
            onClick={showUploadToast}
            className="bg-purple-600 hover:bg-purple-700"
          >
            📤 Upload
          </Button>
          
          <Button 
            onClick={showCameraToast}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            📷 Camera
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}