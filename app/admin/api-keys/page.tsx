'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { 
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string
  created_at: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
      showNotification('error', 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      showNotification('error', 'Please enter a name')
      return
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName })
      })

      if (response.ok) {
        const data = await response.json()
        setNewKeyGenerated(data.apiKey.key)
        setNewKeyName('')
        setShowCreateDialog(false)
        fetchApiKeys()
        showNotification('success', 'API Key created!')
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      showNotification('error', 'Failed to create API key')
    }
  }

  const deleteApiKey = async (id: string, name: string) => {
    if (!confirm(`Delete API key "${name}"?`)) return

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        showNotification('success', 'API Key deleted')
        fetchApiKeys()
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      showNotification('error', 'Failed to delete')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification('success', 'Copied!')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-600 mt-1">Manage API keys for programmatic access</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create API Key
          </button>
        </div>

        {/* New Key Generated */}
        {newKeyGenerated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              ⚠️ Save your API key now!
            </h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-yellow-100 px-3 py-2 rounded text-sm font-mono break-all">
                {newKeyGenerated}
              </code>
              <button onClick={() => copyToClipboard(newKeyGenerated)} className="p-2 hover:bg-yellow-100 rounded">
                <ClipboardDocumentIcon className="w-5 h-5" />
              </button>
            </div>
            <button onClick={() => setNewKeyGenerated(null)} className="mt-2 text-sm text-yellow-700">
              I've saved it
            </button>
          </div>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            <input
              type="text"
              placeholder="API Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex space-x-2">
              <button onClick={createApiKey} className="px-4 py-2 bg-brand-teal text-white rounded-lg">
                Create
              </button>
              <button onClick={() => setShowCreateDialog(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <KeyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No API keys yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{key.name}</h4>
                    <p className="text-sm text-gray-500">{key.key_prefix}••••••••</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => deleteApiKey(key.id, key.name)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
