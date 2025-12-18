'use client'

import { useState, useEffect } from 'react'
import CategoryTabs from './CategoryTabs'
import PackageCard from './PackageCard'
import AdditionalServices from './AdditionalServices'

interface PackageCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  display_order: number
  packages: Package[]
}

interface Package {
  id: string
  name: string
  description: string | null
  price: number
  features: string[]
  isBestSeller: boolean
  display_order: number
}

interface AdditionalService {
  id: string
  name: string
  price: number
  display_order: number
}

export default function PricingAccordion() {
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/public/packages')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setAdditionalServices(data.additionalServices || [])
        
        // Set default category to first one
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(data.categories[0].slug)
        }
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug)
    setExpandedPackage(null) // Reset expanded package when category changes
  }

  const handlePackageToggle = (packageId: string) => {
    setExpandedPackage(expandedPackage === packageId ? null : packageId)
  }

  const currentCategory = categories.find(cat => cat.slug === selectedCategory)
  const packages = currentCategory?.packages || []

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto"></div>
        </div>
      </section>
  )

  }
  return (
    <section id="pricing" className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-4">
            Wedding Packages
          </h2>
          <p className="text-gray-600 text-lg">
            Pilih paket yang sesuai dengan kebutuhan acara Anda
          </p>
        </div>

        {/* Category Tabs - Sticky */}
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Package Cards */}
        <div className="space-y-4 mb-8">
          {packages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">Tidak ada paket tersedia untuk kategori ini</p>
            </div>
          ) : (
            packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                categoryName={currentCategory?.name || ''}
                categoryIcon={currentCategory?.icon || ''}
                isExpanded={expandedPackage === pkg.id}
                onToggle={() => handlePackageToggle(pkg.id)}
              />
            ))
          )}
        </div>

        {/* Additional Services */}
        {additionalServices.length > 0 && (
          <AdditionalServices services={additionalServices} />
        )}

        {/* Microcopy Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-600 italic">
            *Harga dapat disesuaikan dengan kebutuhan acara
          </p>
          <p className="text-sm text-gray-600 italic">
            *Konsultasi gratis & cepat via WhatsApp
          </p>
        </div>
      </div>
    </section>
  )
}
