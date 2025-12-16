'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { MessageSquare, Clock, Phone, Mail, Calendar } from 'lucide-react'

interface FormSubmission {
  id: string
  name: string
  whatsapp: string
  email: string
  packageInterest: string | null
  weddingDate: string | null
  message: string | null
  status: string
  notes: string | null
  createdAt: string
}

export default function FormSubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [notes, setNotes] = useState('')

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/landing-page/form-submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions, selectedStatus])

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/form-submissions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      await fetchSubmissions()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedSubmission) return

    try {
      await fetch(`/api/admin/form-submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      setSelectedSubmission(null)
      setNotes('')
      await fetchSubmissions()
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'booked':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statusCounts = {
    all: submissions.length,
    new: submissions.filter((s) => s.status === 'new').length,
    contacted: submissions.filter((s) => s.status === 'contacted').length,
    booked: submissions.filter((s) => s.status === 'booked').length,
    closed: submissions.filter((s) => s.status === 'closed').length
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-gray-600 mt-1">Kelola inquiry dari conversational form</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`p-4 rounded-lg shadow transition-all ${
              selectedStatus === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-900 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts.all}</p>
            <p className="text-sm mt-1">All</p>
          </button>
          <button
            onClick={() => setSelectedStatus('new')}
            className={`p-4 rounded-lg shadow transition-all ${
              selectedStatus === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts.new}</p>
            <p className="text-sm mt-1">New</p>
          </button>
          <button
            onClick={() => setSelectedStatus('contacted')}
            className={`p-4 rounded-lg shadow transition-all ${
              selectedStatus === 'contacted'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-900 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts.contacted}</p>
            <p className="text-sm mt-1">Contacted</p>
          </button>
          <button
            onClick={() => setSelectedStatus('booked')}
            className={`p-4 rounded-lg shadow transition-all ${
              selectedStatus === 'booked'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-900 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts.booked}</p>
            <p className="text-sm mt-1">Booked</p>
          </button>
          <button
            onClick={() => setSelectedStatus('closed')}
            className={`p-4 rounded-lg shadow transition-all ${
              selectedStatus === 'closed'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-900 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts.closed}</p>
            <p className="text-sm mt-1">Closed</p>
          </button>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No submissions yet for this status.
            </div>
          ) : (
            <div className="divide-y">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{submission.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a
                            href={`https://wa.me/${submission.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {submission.whatsapp}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a
                            href={`mailto:${submission.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {submission.email}
                          </a>
                        </div>
                        {submission.packageInterest && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>{submission.packageInterest}</span>
                          </div>
                        )}
                        {submission.weddingDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{submission.weddingDate}</span>
                          </div>
                        )}
                      </div>

                      {submission.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-3">
                          {submission.message}
                        </p>
                      )}

                      {submission.notes && (
                        <div className="bg-yellow-50 p-3 rounded mb-3">
                          <p className="text-xs font-medium text-yellow-800 mb-1">Internal Notes:</p>
                          <p className="text-sm text-gray-700">{submission.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(submission.createdAt).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <select
                        value={submission.status}
                        onChange={(e) => handleUpdateStatus(submission.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="booked">Booked</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setNotes(submission.notes || '')
                        }}
                        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Internal Note</h2>
              <p className="text-sm text-gray-600 mb-4">
                For: <strong>{selectedSubmission.name}</strong>
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes here..."
                className="w-full border rounded-lg px-3 py-2 h-32"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedSubmission(null)
                    setNotes('')
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
