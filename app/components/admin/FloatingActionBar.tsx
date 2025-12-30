'use client'

import { TrashIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FloatingActionBarProps {
  selectedCount: number
  onDelete: () => void
  onDownload: () => void
  onCancel: () => void
  isDeleting?: boolean
  isDownloading?: boolean
}

export default function FloatingActionBar({
  selectedCount,
  onDelete,
  onDownload,
  onCancel,
  isDeleting = false,
  isDownloading = false,
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-white/10">
        {/* Selected Count */}
        <div className="text-sm font-semibold">
          {selectedCount} selected
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-white/20" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Download All */}
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>

          {/* Move to Trash */}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Move to Trash'}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
