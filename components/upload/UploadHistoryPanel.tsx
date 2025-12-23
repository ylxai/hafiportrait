/**
 * Upload History Panel Component
 * 
 * Displays recently completed uploads with:
 * - Upload timestamps
 * - File counts
 * - Total sizes
 * - Clear history action
 */

'use client';

import { UploadHistory } from '@/lib/upload/uploadPersistence';
import { 
  ClockIcon as Clock, 
  CheckCircleIcon as CheckCircle, 
  TrashIcon as Trash2 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface UploadHistoryPanelProps {
  history: UploadHistory[];
  onClearHistory: () => void;
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

export function UploadHistoryPanel({ history, onClearHistory }: UploadHistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Belum ada riwayat upload</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Riwayat Upload</h3>
        <button
          onClick={onClearHistory}
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Hapus Riwayat
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {history.map((entry) => (
          <div key={entry.sessionId} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.fileCount} foto berhasil diupload
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(entry.totalSize)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <time dateTime={new Date(entry.completedAt).toISOString()}>
                    {format(entry.completedAt, "d MMM yyyy 'pukul' HH:mm", {
                      locale: idLocale,
                    })}
                  </time>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
