'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { DollarSign, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
// import { GripVertical } from 'lucide-react' // For future drag & drop reordering

interface PricingPackage {
  id: string
  name: string
  slug: string
  category: string
  price: string
  currency: string
  description: string | null
  duration: string | null
  shot_count: number | null
  features: string[]
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pricing')
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages, categoryFilter])

  const deletePackage = async (id: string) => {
    if (!confirm('Delete this package?')) return

    try {
      const response = await fetch(`/api/admin/pricing?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchPackages()
      }
    } catch (error) {
      console.error('Failed to delete package:', error)
    }
  }

  const toggleActive = async (pkg: PricingPackage) => {
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          updates: { id: pkg.id, is_active: !pkg.is_active },
        }),
      })

      if (response.ok) {
        fetchPackages()
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  const categories = Array.from(new Set(packages.map(p => p.category).filter((cat): cat is string => cat !== null)))

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Price List Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage photography packages and pricing
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPackage(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Package</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-brand-teal/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Packages</p>
                <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {packages.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Package List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No packages yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-brand-teal hover:text-brand-teal/80 font-medium"
              >
                Create your first package →
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${!pkg.is_active ? 'opacity-60' : ''
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {pkg.name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {pkg.category}
                        </span>
                        {!pkg.is_active && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline space-x-2 mb-3">
                        <span className="text-3xl font-bold text-brand-teal">
                          {pkg.currency === 'IDR' ? 'Rp' : pkg.currency}{' '}
                          {parseFloat(pkg.price).toLocaleString('id-ID')}
                        </span>
                        {pkg.duration && (
                          <span className="text-sm text-gray-600">/ {pkg.duration}</span>
                        )}
                      </div>

                      {pkg.description && (
                        <p className="text-gray-600 mb-3">{pkg.description}</p>
                      )}

                      {pkg.shot_count && (
                        <p className="text-sm text-gray-600 mb-2">
                          📸 {pkg.shot_count} photos
                        </p>
                      )}

                      {pkg.features.length > 0 && (
                        <ul className="space-y-1">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-brand-teal mr-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleActive(pkg)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title={pkg.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {pkg.is_active ? (
                          <Eye className="w-5 h-5 text-green-600" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPackage(pkg)
                          setShowForm(true)
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💰 Pricing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create packages for different photography categories (Wedding, Portrait, Event)</li>
            <li>• Include detailed features and what's included in each package</li>
            <li>• Toggle visibility to show/hide packages on your public pricing page</li>
            <li>• Drag to reorder packages (coming soon)</li>
          </ul>
        </div>
      </div>

      {/* Package Form Modal */}
      {showForm && (
        <PackageFormModal
          package={editingPackage}
          onClose={() => {
            setShowForm(false)
            setEditingPackage(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingPackage(null)
            fetchPackages()
          }}
        />
      )}
    </AdminLayout>
  )
}

interface PackageFormModalProps {
  package: PricingPackage | null
  onClose: () => void
  onSuccess: () => void
}

function PackageFormModal({ package: pkg, onClose, onSuccess }: PackageFormModalProps) {
  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    category: pkg?.category || 'Wedding',
    price: pkg?.price || '',
    currency: pkg?.currency || 'IDR',
    description: pkg?.description || '',
    duration: pkg?.duration || '',
    shot_count: pkg?.shot_count?.toString() || '',
    features: pkg?.features || [],
    is_active: pkg?.is_active ?? true,
  })
  const [featureInput, setFeatureInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      })
      setFeatureInput('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = '/api/admin/pricing'
      const method = pkg ? 'PUT' : 'POST'
      const body = pkg
        ? {
          action: 'update',
          updates: {
            id: pkg.id,
            ...formData,
            shot_count: formData.shot_count ? parseInt(formData.shot_count) : null,
          },
        }
        : {
          ...formData,
          shot_count: formData.shot_count ? parseInt(formData.shot_count) : null,
        }

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        onSuccess()
      } else {
        throw new Error('Failed to save package')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save package')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {pkg ? 'Edit Package' : 'Add New Package'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Wedding Package"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              >
                <option value="Wedding">Wedding</option>
                <option value="Portrait">Portrait</option>
                <option value="Event">Event</option>
                <option value="Product">Product</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="5000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 8 hours, Full day"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Photos
              </label>
              <input
                type="number"
                value={formData.shot_count}
                onChange={(e) => setFormData({ ...formData, shot_count: e.target.value })}
                placeholder="e.g., 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the package..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features Included
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {formData.features.length > 0 && (
                <ul className="space-y-2">
                  {formData.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm text-gray-700">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                />
                <span className="text-sm text-gray-700">Show on public pricing page</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : pkg ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
