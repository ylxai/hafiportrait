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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 px-4 w-full max-w-[95vw] sm:max-w-max">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-3 py-2 sm:px-6 sm:py-3 flex items-center gap-2 sm:gap-6 border border-white/10">
        {/* Selected Count */}
        <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
          {selectedCount} <span className="hidden sm:inline">selected</span>
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="hidden sm:block h-8 w-px bg-white/20" />

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 sm:flex-none justify-end">
          {/* Download All */}
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            title="Download selected photos"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
          </button>

          {/* Move to Trash */}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            title="Move to trash"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Trash'}</span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            title="Cancel selection"
          >
            <XMarkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
