/**
 * SortMenu Component
 * Auto-sort dropdown with sort options and direction
 */

'use client'

import { useState, useEffect } from 'react'
import {
  ArrowsUpDownIcon as ArrowUpDown,
  ArrowUpIcon as ArrowUp,
  ArrowDownIcon as ArrowDown,
  CalendarIcon as Calendar,
  DocumentTextIcon as FileText,
  ServerIcon as HardDrive,
  CameraIcon as Camera,
  CheckIcon as Check,
} from '@heroicons/react/24/outline'

interface SortMenuProps {
  onSort: (sortBy: string, direction: 'asc' | 'desc') => void
  isLoading?: boolean
  currentSort?: string
}

interface SortOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const sortOptions: SortOption[] = [
  { id: 'uploadDate', label: 'Upload Date', icon: Calendar },
  { id: 'fileName', label: 'File Name', icon: FileText },
  { id: 'file_size', label: 'File Size', icon: HardDrive },
  { id: 'dateTaken', label: 'Date Taken (EXIF)', icon: Camera },
]

export default function SortMenu({
  onSort,
  isLoading = false,
  currentSort = 'order',
}: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedSort, setSelectedSort] = useState<string>(
    currentSort || 'uploadDate'
  )
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  // Sync selectedSort with currentSort prop
  useEffect(() => {
    if (currentSort && currentSort !== selectedSort) {
      setSelectedSort(currentSort)
    }
  }, [currentSort, selectedSort])

  const handleSortClick = (sortId: string) => {
    setSelectedSort(sortId)
    setShowConfirmation(true)
    setIsOpen(false)
  }

  const handleConfirmSort = () => {
    onSort(selectedSort, direction)
    setShowConfirmation(false)
  }

  const handleCancelSort = () => {
    setShowConfirmation(false)
  }

  const toggleDirection = () => {
    setDirection(direction === 'asc' ? 'desc' : 'asc')
  }

  const selectedOption = sortOptions.find((opt) => opt.id === selectedSort)

  return (
    <>
      {/* Sort Menu Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>Auto-Sort</span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="p-2">
                <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                  Sort By
                </div>
                {sortOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSortClick(option.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 text-left">{option.label}</span>
                      {selectedSort === option.id && (
                        <Check className="h-4 w-4 text-[#54ACBF]" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-gray-200 p-2">
                <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                  Direction
                </div>
                <button
                  onClick={toggleDirection}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {direction === 'asc' ? (
                    <ArrowUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="flex-1 text-left">
                    {direction === 'asc' ? 'Ascending' : 'Descending'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Auto-Sort
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Reorder all photos by{' '}
              <span className="font-semibold">{selectedOption.label}</span> (
              {direction === 'asc' ? 'Ascending' : 'Descending'})?
            </p>
            <p className="mt-2 text-xs text-gray-500">
              This will update the display order for all photos in this event.
              You can undo this action.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancelSort}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSort}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-[#54ACBF] px-4 py-2 text-sm font-medium text-white hover:bg-[#54ACBF]/90 disabled:opacity-50"
              >
                {isLoading ? 'Sorting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
