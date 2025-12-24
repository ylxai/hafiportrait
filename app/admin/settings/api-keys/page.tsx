'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(365);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays
        })
      });

      const data = await response.json();

      if (data.success) {
        setCreatedKey(data.data.apiKey);
        setNewKeyName('');
        setShowCreateForm(false);
        await loadApiKeys();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create API key');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId })
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-gray-600">
          Manage API keys for automation scripts, mobile apps, and third-party integrations
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Created Key Modal */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-green-600">✅ API Key Created!</h2>
            
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <p className="font-bold text-yellow-800 mb-2">⚠️ IMPORTANT: Save this key now!</p>
              <p className="text-sm text-yellow-700">
                This is the only time you will see this key. Store it securely - we cannot retrieve it later.
              </p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <code className="text-sm break-all flex-1">{createdKey}</code>
                <button
                  onClick={() => copyToClipboard(createdKey)}
                  className="ml-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
              <p className="font-semibold mb-1">Usage Example:</p>
              <code className="block bg-white p-2 rounded text-xs overflow-x-auto">
                curl -X POST https://yourdomain.com/api/admin/photos/upload \<br/>
                &nbsp;&nbsp;-H "X-API-Key: {createdKey.substring(0, 20)}..." \<br/>
                &nbsp;&nbsp;-F "event_id=your-event-id" \<br/>
                &nbsp;&nbsp;-F "file=@photo.jpg"
              </code>
            </div>

            <button
              onClick={() => setCreatedKey(null)}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold"
            >
              I've saved the key
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm ? (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-bold mb-4">Create New API Key</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Key Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Python Upload Script, Mobile App, Lightroom Plugin"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Expires In (Days)
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createApiKey}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create API Key
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create New API Key
        </button>
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No API keys yet. Create one to get started!
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key.id} className={key.revoked_at ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 font-medium">{key.name}</td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {key.key_prefix}...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(key.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {key.revoked_at ? (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Revoked
                      </span>
                    ) : new Date(key.expires_at) < new Date() ? (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!key.revoked_at && (
                      <button
                        onClick={() => revokeApiKey(key.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-3">📖 How to Use API Keys</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">1. In HTTP Requests:</p>
            <code className="block bg-white p-2 rounded">
              curl -H "X-API-Key: hpk_your_key_here" https://yourapi.com/endpoint
            </code>
          </div>

          <div>
            <p className="font-semibold mb-1">2. In Python Scripts:</p>
            <code className="block bg-white p-2 rounded text-xs">
              headers = {'{'}&#x27;X-API-Key&#x27;: &#x27;hpk_your_key_here&#x27;{'}'}<br/>
              response = requests.post(url, headers=headers, files=files)
            </code>
          </div>

          <div>
            <p className="font-semibold mb-1">3. Security Best Practices:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Never commit API keys to version control</li>
              <li>Store keys in environment variables or secure vaults</li>
              <li>Rotate keys regularly (every 6-12 months)</li>
              <li>Revoke keys immediately if compromised</li>
              <li>Use separate keys for different applications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
