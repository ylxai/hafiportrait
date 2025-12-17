'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { FolderOpen, Plus, Edit2, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PackageCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  display_order: number
  is_active: boolean
  _count?: {
    packages: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PackageCategory | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/packages/categories', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini? Semua paket dalam kategori akan terhapus.')) return

    try {
      const response = await fetch(`/api/admin/packages/categories?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const toggleActive = async (cat: PackageCategory) => {
    try {
      const response = await fetch('/api/admin/packages/categories', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          is_active: !cat.is_active,
        }),
      })

      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/packages"
              className="inline-flex items-center text-sm text-gray-600 hover:text-brand-teal mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Packages
            </Link>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Category Management
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola kategori paket fotografi
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Kategori</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Belum ada kategori</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-brand-teal hover:text-brand-teal/80 font-medium"
              >
                Buat kategori pertama →
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${!cat.is_active ? 'opacity-60' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{cat.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <span>{cat.name}</span>
                          {!cat.is_active && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                              Tidak Aktif
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Slug: {cat.slug} • Order: {cat.display_order}
                          {cat._count && ` • ${cat._count.packages} paket`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleActive(cat)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title={cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {cat.is_active ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(cat)
                          setShowForm(true)
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
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
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setShowForm(false)
            setEditingCategory(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingCategory(null)
            fetchCategories()
          }}
        />
      )}
    </AdminLayout>
  )
}

interface CategoryFormModalProps {
  category: PackageCategory | null
  onClose: () => void
  onSuccess: () => void
}

function CategoryFormModal({ category: cat, onClose, onSuccess }: CategoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: cat?.name || '',
    slug: cat?.slug || '',
    icon: cat?.icon || '📦',
    display_order: cat?.display_order?.toString() || '0',
    is_active: cat?.is_active !== undefined ? cat.is_active : true,
  })
  const [submitting, setSubmitting] = useState(false)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: cat ? formData.slug : generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = '/api/admin/packages/categories'
      const method = cat ? 'PUT' : 'POST'
      const body = cat
        ? {
          id: cat.id,
          ...formData,
          display_order: parseInt(formData.display_order),
        }
        : {
          ...formData,
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
        throw new Error('Failed to save category')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Gagal menyimpan kategori')
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
              {cat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
              Nama Kategori *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Akad"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., akad"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (Emoji) *
            </label>
            <input
              type="text"
              required
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g., 💍"
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
              {submitting ? 'Menyimpan...' : cat ? 'Update Kategori' : 'Buat Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
