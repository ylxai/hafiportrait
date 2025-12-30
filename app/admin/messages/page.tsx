'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import {
  ChatBubbleLeftEllipsisIcon as MessageSquare,
  EnvelopeIcon as Mail,
  PhoneIcon as Phone,
  ClockIcon as Clock,
  CheckCircleIcon as CheckCircle,
  ArrowUturnLeftIcon as Reply,
  TrashIcon as Trash2,
  FunnelIcon as Filter,
  ArrowDownTrayIcon as Download,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { useAdminToast } from '@/hooks/toast/useAdminToast'
import { copyToClipboardWithToast } from '@/lib/toast/toast-utils'
import ErrorAlert from '@/components/ui/ErrorAlert'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  created_at: string
}

type TabKey = 'contact' | 'guestbook'

interface GuestbookMessage {
  id: string
  guest_name: string
  email: string | null
  message: string
  relationship: string | null
  attendance_status: 'UNKNOWN' | 'ATTENDING' | 'NOT_ATTENDING'
  created_at: string
  event_id: string
  event_name?: string
  event_slug?: string
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('contact')
  
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const toast = useAdminToast()

  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([])
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchMessages = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch messages (${response.status})`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch messages'
      setError(message)
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGuestbook = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        page: '1',
        limit: '50',
      })
      if (searchQuery) qs.set('q', searchQuery)
      if (selectedEventId && selectedEventId !== 'all') qs.set('event_id', selectedEventId)

      const res = await fetch(`/api/admin/guestbook?${qs.toString()}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch guestbook')
      setGuestbookMessages(data.messages || [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch guestbook'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedEventId])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/events?limit=200', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const list = data?.data?.events || []
      setEvents(list.map((e: any) => ({ id: e.id, name: e.name })))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (activeTab === 'contact') {
      fetchMessages()
    } else {
      fetchGuestbook()
    }
  }, [fetchMessages, fetchGuestbook, statusFilter, activeTab, searchQuery, selectedEventId])

  const updateMessageStatus = async (
    messageId: string,
    status: 'new' | 'read' | 'replied',
    clientName: string
  ) => {
    const loadingToastId = toast.showLoading('Updating status...')

    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update message')
      }

      const statusLabel = status === 'replied' ? 'Replied' : status === 'read' ? 'Read' : 'New'
      toast.updateToast(loadingToastId, 'success', `Status diubah ke ${statusLabel}`)
      
      if (status === 'replied') {
        toast.message.replySuccess(clientName)
      }
      
      fetchMessages()
    } catch (error) {
      console.error('Failed to update message:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal update status')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    const loadingToastId = toast.showLoading('Menghapus pesan...')

    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      toast.updateToast(loadingToastId, 'success', 'Pesan berhasil dihapus')
      setSelectedMessage(null)
      fetchMessages()
    } catch (error) {
      console.error('Failed to delete message:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal menghapus pesan')
    }
  }

  const deleteGuestbookMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this guestbook message?')) {
      return
    }

    const loadingToastId = toast.showLoading('Menghapus ucapan...')

    try {
      const response = await fetch(`/api/admin/guestbook/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete guestbook message')
      }

      toast.updateToast(loadingToastId, 'success', 'Ucapan berhasil dihapus')
      fetchGuestbook()
    } catch (error) {
      console.error('Failed to delete guestbook message:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal menghapus ucapan')
    }
  }

  const openWhatsApp = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      const waUrl = `https://wa.me/${cleanPhone}`
      window.open(waUrl, '_blank')
      toast.message.statusUpdateSuccess('WhatsApp')
    }
  }

  const copyEmail = async (email: string) => {
    await copyToClipboardWithToast(email, 'Email')
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-gray-100 text-gray-800',
      replied: 'bg-green-100 text-green-800',
    }
    return badges[status as keyof typeof badges] || badges.new
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <MessageSquare className="w-4 h-4" />
      case 'read':
        return <CheckCircle className="w-4 h-4" />
      case 'replied':
        return <Reply className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Error Alert */}
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Client Messages
            </h1>
            <p className="text-gray-600 mt-1">
              Manage inquiries dan komunikasi dengan clients
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'contact'
                    ? 'border-brand-teal text-brand-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Contact Messages</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('guestbook')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'guestbook'
                    ? 'border-brand-teal text-brand-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Guestbook Messages</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filter - Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex space-x-2">
                {['all', 'new', 'read', 'replied'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-brand-teal text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter - Guestbook Tab */}
        {activeTab === 'guestbook' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                >
                  <option value="all">All Events</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Contact Messages List */}
        {activeTab === 'contact' && (
          <>
            {loading ? (
              <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? 'No client messages yet'
                    : `No ${statusFilter} messages`}
                </p>
              </div>
            ) : (
          <div className="grid gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMessage(msg)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {msg.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(
                          msg.status
                        )}`}
                      >
                        {getStatusIcon(msg.status)}
                        <span>{msg.status.toUpperCase()}</span>
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center space-x-4 mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyEmail(msg.email)
                        }}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-teal"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{msg.email}</span>
                      </button>
                      {msg.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openWhatsApp(msg.phone!)
                          }}
                          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600"
                        >
                          <Phone className="w-4 h-4" />
                          <span>{msg.phone}</span>
                        </button>
                      )}
                    </div>

                    {/* Message Preview */}
                    <p className="text-gray-700 line-clamp-2 mb-2">
                      {msg.message}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateMessageStatus(msg.id, 'replied', msg.name)
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Mark as Replied"
                    >
                      <Reply className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMessage(msg.id)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {/* Guestbook Messages List */}
        {activeTab === 'guestbook' && (
          <>
            {loading ? (
              <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : guestbookMessages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No guestbook messages</h3>
                <p className="text-gray-500">
                  {searchQuery || selectedEventId !== 'all'
                    ? 'No messages match your filters'
                    : 'No guestbook messages yet'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {guestbookMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {msg.guest_name}
                          </h3>
                          {msg.event_name && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {msg.event_name}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
                          {msg.email && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyEmail(msg.email!)
                              }}
                              className="flex items-center space-x-2 hover:text-brand-teal"
                            >
                              <Mail className="w-4 h-4" />
                              <span>{msg.email}</span>
                            </button>
                          )}
                          {msg.relationship && (
                            <span className="flex items-center space-x-2">
                              <span className="font-medium">Relationship:</span>
                              <span>{msg.relationship}</span>
                            </span>
                          )}
                          {msg.attendance_status !== 'UNKNOWN' && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              msg.attendance_status === 'ATTENDING'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {msg.attendance_status === 'ATTENDING' ? '✓ Attending' : 'Not Attending'}
                            </span>
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                          {msg.message}
                        </p>

                        {/* Timestamp */}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteGuestbookMessage(msg.id)
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Message Detail Modal - TODO: Implement if needed */}
      {selectedMessage && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Message from {selectedMessage.name}</h2>
            <p className="text-gray-700 mb-4">{selectedMessage.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
