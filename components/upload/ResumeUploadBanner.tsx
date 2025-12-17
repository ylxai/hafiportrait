/**
 * Resume Upload Banner Component
 * 
 * Shows banner when pending uploads are detected:
 * - Number of pending files
 * - Total size
 * - Resume and Cancel actions
 * - Last upload timestamp
 */

'use client';

import { UploadSession } from '@/lib/upload/uploadPersistence';
import { Clock, Upload, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ResumeUploadBannerProps {
  session: UploadSession;
  onResume: () => void;
  onCancel: () => void;
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function ResumeUploadBanner({ session, onResume, onCancel }: ResumeUploadBannerProps) {
  // Calculate pending files
  const pendingFiles = session.files.filter(
    file => file.status === 'queued' || file.status === 'uploading' || file.status === 'paused' || file.status === 'failed'
  );

  const totalSize = pendingFiles.reduce((sum, file) => sum + file.file.size, 0);
  const uploadedSize = pendingFiles.reduce((sum, file) => {
    return sum + (file.uploadedBytes || Math.floor((file.file.size * file.progress) / 100));
  }, 0);

  const remainingSize = totalSize - uploadedSize;
  const overallProgress = totalSize > 0 ? Math.floor((uploadedSize / totalSize) * 100) : 0;

  // Format last updated time
  const lastUpdatedText = formatDistanceToNow(session.updated_at, {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Upload className="h-5 w-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-blue-900 mb-1">
            Upload Tertunda Terdeteksi
          </h3>
          
          <p className="text-sm text-blue-800 mb-3">
            Ada {pendingFiles.length} foto yang belum selesai diupload.
            {overallProgress > 0 && ` Progress: ${overallProgress}%`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <div className="text-blue-700 font-medium">Total File</div>
              <div className="text-blue-900">{pendingFiles.length} foto</div>
            </div>
            <div>
              <div className="text-blue-700 font-medium">Ukuran Tersisa</div>
              <div className="text-blue-900">{formatFileSize(remainingSize)}</div>
            </div>
          </div>

          {overallProgress > 0 && (
            <div className="mb-4">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-blue-700 mb-4">
            <Clock className="h-3.5 w-3.5" />
            <span>Terakhir diupdate {lastUpdatedText}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResume}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Lanjutkan Upload
            </button>
            
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Batalkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
