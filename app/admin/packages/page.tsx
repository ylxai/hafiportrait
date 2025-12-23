'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { 
  CubeIcon as Package, 
  PlusIcon as Plus, 
  PencilIcon as Edit2, 
  TrashIcon as Trash2, 
  EyeIcon as Eye, 
  EyeSlashIcon as EyeOff, 
  StarIcon as Star 
} from '@heroicons/react/24/outline'
import { useAdminToast } from '@/hooks/toast/useAdminToast'

interface PackageCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  display_order: number
  is_active: boolean
}

interface PackageItem {
  id: string
  name: string
  description: string | null
  price: number
  features: string[]
  is_best_seller: boolean
  is_active: boolean
  display_order: number
  category_id: string
  category: PackageCategory
  created_at: string
  updated_at: string
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [categories] = useState<PackageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [_showForm, setShowForm] = useState(false)
  const [_editingPackage, setEditingPackage] = useState<PackageItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const toast = useAdminToast()

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/packages')
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
    fetchData()
  }, [fetchData, categoryFilter])

  const deletePackage = async (id: string, packageName: string) => {
    if (!confirm(`Hapus paket "${packageName}"?`)) return

    const loadingToastId = toast.showLoading(`Menghapus paket "${packageName}"...`)

    try {
      const response = await fetch(`/api/admin/packages?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.updateToast(loadingToastId, 'success', `Paket "${packageName}" berhasil dihapus!`)
        fetchData()
      } else {
        toast.updateToast(loadingToastId, 'error', 'Gagal menghapus paket')
      }
    } catch (error) {
      console.error('Failed to delete package:', error)
      toast.updateToast(loadingToastId, 'error', 'Terjadi kesalahan')
    }
  }

  const toggleActive = async (pkg: PackageItem) => {
    const newStatus = !pkg.is_active

    try {
      const response = await fetch('/api/admin/packages', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pkg.id,
          is_active: newStatus,
        }),
      })

      if (response.ok) {
        toast.package.toggleActiveSuccess(pkg.name, newStatus)
        fetchData()
      } else {
        toast.generic.saveError()
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
      toast.generic.networkError()
    }
  }

  const toggleBestSeller = async (pkg: PackageItem) => {
    const newStatus = !pkg.is_best_seller

    try {
      const response = await fetch('/api/admin/packages', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pkg.id,
          is_best_seller: newStatus,
        }),
      })

      if (response.ok) {
        toast.package.toggleBestSellerSuccess(pkg.name, newStatus)
        fetchData()
      } else {
        toast.generic.saveError()
      }
    } catch (error) {
      console.error('Failed to toggle best seller:', error)
      toast.generic.networkError()
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
              Package Management
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola paket fotografi wedding
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPackage(null)
              setShowForm(true)
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Package</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first package to start managing your offerings
            </p>
            <button
              onClick={() => {
                setEditingPackage(null)
                setShowForm(true)
              }}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Package</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* Package Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pkg.name}
                      {pkg.is_best_seller && (
                        <span className="ml-2 text-yellow-500">⭐</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{pkg.category.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={`p-2 rounded-lg transition-colors ${pkg.is_active
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      title={pkg.is_active ? 'Active' : 'Inactive'}
                    >
                      {pkg.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleBestSeller(pkg)}
                      className={`p-2 rounded-lg transition-colors ${pkg.is_best_seller
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      title={pkg.is_best_seller ? 'Best Seller' : 'Mark as Best Seller'}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-2xl font-bold text-brand-teal">
                    {formatPrice(pkg.price)}
                  </p>
                </div>

                {/* Description */}
                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                )}

                {/* Features */}
                <div className="mb-4">
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-brand-teal mr-2">✓</span>
                        <span className="flex-1">{feature}</span>
                      </li>
                    ))}
                    {pkg.features.length > 3 && (
                      <li className="text-sm text-gray-400">
                        +{pkg.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingPackage(pkg)
                      setShowForm(true)
                    }}
                    className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deletePackage(pkg.id, pkg.name)}
                    className="flex-1 btn btn-danger flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
