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

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const toast = useAdminToast()

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages, statusFilter])

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

        {/* Filter */}
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

        {/* Messages List */}
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
