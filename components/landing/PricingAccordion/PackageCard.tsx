'use client'

import { ChevronDown, Star, Camera, Clock, BookOpen, Image } from 'lucide-react'
import WhatsAppButton from './WhatsAppButton'

interface Package {
  id: string
  name: string
  description: string | null
  price: number
  features: string[]
  isBestSeller: boolean
}

interface PackageCardProps {
  package: Package
  categoryName: string
  categoryIcon: string
  isExpanded: boolean
  onToggle: () => void
}

export default function PackageCard({
  package: pkg,
  categoryName,
  categoryIcon,
  isExpanded,
  onToggle,
}: PackageCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Extract highlight features (first 4 or key features)
  const highlightFeatures = pkg.features.slice(0, 4)
  const remainingFeatures = pkg.features.slice(4)

  // Get icon for feature based on content
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase()
    if (lowerFeature.includes('photographer') || lowerFeature.includes('foto')) {
      return <Camera className="w-4 h-4 text-brand-teal flex-shrink-0" />
    }
    if (lowerFeature.includes('jam') || lowerFeature.includes('hari')) {
      return <Clock className="w-4 h-4 text-brand-teal flex-shrink-0" />
    }
    if (lowerFeature.includes('album')) {
      return <BookOpen className="w-4 h-4 text-brand-teal flex-shrink-0" />
    }
    if (lowerFeature.includes('cetak') || lowerFeature.includes('edited')) {
      return <Image className="w-4 h-4 text-brand-teal flex-shrink-0" aria-label="Print/edited feature" />
    }
    return <span className="text-brand-teal text-sm flex-shrink-0">✓</span>
  }

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300
        ${isExpanded ? 'ring-2 ring-brand-teal' : 'hover:shadow-lg'}
      `}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">
              {pkg.name}
            </h3>
            {pkg.isBestSeller && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Best Seller
              </span>
            )}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-brand-teal">
            {formatPrice(pkg.price)}
          </div>
        </div>
        <div className="ml-4">
          <ChevronDown
            className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-5 pb-5 space-y-4">
          {/* Description */}
          {pkg.description && (
            <p className="text-gray-600 text-sm md:text-base italic border-t pt-4">
              {pkg.description}
            </p>
          )}

          {/* Highlight Features */}
          <div className="space-y-2.5">
            {highlightFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                {getFeatureIcon(feature)}
                <span className="text-gray-700 text-sm md:text-base leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Additional Features (Collapsible) */}
          {remainingFeatures.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-brand-teal hover:text-brand-teal/80 font-medium flex items-center space-x-1">
                <span>Detail lengkap</span>
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                {remainingFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-brand-teal text-xs">✓</span>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* WhatsApp CTA Button */}
          <WhatsAppButton
            packageName={pkg.name}
            categoryName={categoryName}
            price={pkg.price}
          />
        </div>
      </div>
    </div>
  )
}
