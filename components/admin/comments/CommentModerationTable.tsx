'use client'

/**
 * Comment Moderation Table Component
 * Displays comments with moderation actions
 */

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface Comment {
  id: string
  guest_name: string
  email: string | null
  message: string
  relationship: string | null
  attendance_status?: 'UNKNOWN' | 'ATTENDING' | 'NOT_ATTENDING'
  status: string
  created_at: Date
  photos: {
    filename: string
    thumbnail_url: string | null
  } | null
}

interface CommentModerationTableProps {
  event_id: string
  initialComments: Comment[]
  initialTotalCount: number
  initialPendingCount: number
}

export default function CommentModerationTable({
  event_id,
  initialComments,
  initialTotalCount,
  initialPendingCount,
}: CommentModerationTableProps) {
  const [comments, setComments] = useState(initialComments)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Filter comments
  const filteredComments = comments.filter((comment) => {
    const matchesStatus =
      filterStatus === 'all' || comment.status === filterStatus
    const matchesSearch =
      searchQuery === '' ||
      comment.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredComments.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  // Handle individual select
  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((cid) => cid !== id))
    }
  }

  // Handle bulk action
  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.length === 0) {
      alert('Please select comments to perform action')
      return
    }

    const confirmMsg = `Are you sure you want to ${action} ${selectedIds.length} comment(s)?`
    if (!confirm(confirmMsg)) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/events/${event_id}/comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentIds: selectedIds,
          action,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform action')
      }

      // Update local state
      if (action === 'delete') {
        setComments(comments.filter((c) => !selectedIds.includes(c.id)))
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        setComments(
          comments.map((c) =>
            selectedIds.includes(c.id) ? { ...c, status: newStatus } : c
          )
        )
      }

      setSelectedIds([])
      alert(`Successfully ${action}d ${selectedIds.length} comment(s)`)
    } catch (error) {
      console.error('Error performing action:', error)
      alert('Failed to perform action')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/events/${event_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      })

      if (!response.ok) {
        throw new Error('Failed to export')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comments-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export comments')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Stats Overview */}
      <div className="border-b border-gray-200 bg-gray-50 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="mr-3 h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Comments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {initialTotalCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center">
              <ClockIcon className="mr-3 h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Review
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {initialPendingCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="mr-3 h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {initialTotalCount - initialPendingCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="max-w-md flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === filteredComments.length &&
                    filteredComments.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredComments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No comments found
                </td>
              </tr>
            ) : (
              filteredComments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(comment.id)}
                      onChange={(e) =>
                        handleSelect(comment.id, e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {comment.guest_name}
                      </div>
                      {comment.email && (
                        <div className="text-sm text-gray-500">
                          {comment.email}
                        </div>
                      )}
                      {(comment.relationship || comment.attendance_status) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {comment.relationship && (
                            <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {comment.relationship}
                            </span>
                          )}
                          {comment.attendance_status && comment.attendance_status !== 'UNKNOWN' && (
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                comment.attendance_status === 'ATTENDING'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {comment.attendance_status === 'ATTENDING'
                                ? 'Hadir'
                                : 'Tidak Hadir'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="line-clamp-2 text-sm text-gray-900">
                        {comment.message}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        comment.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : comment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {comment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {comment.status !== 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedIds([comment.id])
                            handleBulkAction('approve')
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      {comment.status !== 'rejected' && (
                        <button
                          onClick={() => {
                            setSelectedIds([comment.id])
                            handleBulkAction('reject')
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Reject"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedIds([comment.id])
                          handleBulkAction('delete')
                        }}
                        className="text-gray-600 hover:text-gray-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
