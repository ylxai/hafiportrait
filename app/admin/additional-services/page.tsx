'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { 
  PlusIcon as Plus, 
  PencilIcon as Edit2, 
  TrashIcon as Trash2, 
  EyeIcon as Eye, 
  EyeSlashIcon as EyeOff, 
  WrenchScrewdriverIcon as Wrench 
} from '@heroicons/react/24/outline'

interface AdditionalService {
  id: string
  name: string
  description: string | null
  price: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export default function AdditionalServicesPage() {
  const [services, setServices] = useState<AdditionalService[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<AdditionalService | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/additional-services', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteService = async (id: string) => {
    if (!confirm('Hapus layanan tambahan ini?')) return

    try {
      const response = await fetch(`/api/admin/additional-services?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  const toggleActive = async (svc: AdditionalService) => {
    try {
      const response = await fetch('/api/admin/additional-services', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: svc.id,
          is_active: !svc.is_active,
        }),
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Additional Services
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola layanan tambahan fotografi
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Layanan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-brand-teal/10 rounded-lg">
                <Wrench className="w-6 h-6 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Layanan</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Belum ada layanan tambahan</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-brand-teal hover:text-brand-teal/80 font-medium"
              >
                Buat layanan pertama →
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !svc.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {svc.name}
                        </h3>
                        {!svc.is_active && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                            Tidak Aktif
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-brand-teal">
                          {formatPrice(svc.price)}
                        </span>
                      </div>

                      {svc.description && (
                        <p className="text-gray-600 text-sm">{svc.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleActive(svc)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title={svc.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {svc.is_active ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingService(svc)
                          setShowForm(true)
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteService(svc.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
      </div>

      {showForm && (
        <ServiceFormModal
          service={editingService}
          onClose={() => {
            setShowForm(false)
            setEditingService(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingService(null)
            fetchServices()
          }}
        />
      )}
    </AdminLayout>
  )
}

interface ServiceFormModalProps {
  service: AdditionalService | null
  onClose: () => void
  onSuccess: () => void
}

function ServiceFormModal({ service: svc, onClose, onSuccess }: ServiceFormModalProps) {
  const [formData, setFormData] = useState({
    name: svc?.name || '',
    description: svc?.description || '',
    price: svc?.price?.toString() || '',
    is_active: svc?.is_active !== undefined ? svc.is_active : true,
    display_order: svc?.display_order?.toString() || '0',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = '/api/admin/additional-services'
      const method = svc ? 'PUT' : 'POST'
      const body = svc
        ? {
            id: svc.id,
            ...formData,
            price: parseInt(formData.price),
            display_order: parseInt(formData.display_order),
          }
        : {
            ...formData,
            price: parseInt(formData.price),
            display_order: parseInt(formData.display_order),
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
        throw new Error('Failed to save service')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Gagal menyimpan layanan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {svc ? 'Edit Layanan' : 'Tambah Layanan Baru'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Layanan *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Extra Hours"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga (IDR) *
            </label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="200000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat layanan..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
              />
              <span className="text-sm text-gray-700">Tampilkan di halaman publik</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : svc ? 'Update Layanan' : 'Buat Layanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
