'use client'

import { 
  ChevronDownIcon as ChevronDown, 
  StarIcon as Star, 
  CameraIcon as Camera, 
  ClockIcon as Clock, 
  BookOpenIcon as BookOpen, 
  PhotoIcon as Image 
} from '@heroicons/react/24/outline'
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
    if (
      lowerFeature.includes('photographer') ||
      lowerFeature.includes('foto')
    ) {
      return <Camera className="h-4 w-4 flex-shrink-0 text-brand-teal" />
    }
    if (lowerFeature.includes('jam') || lowerFeature.includes('hari')) {
      return <Clock className="h-4 w-4 flex-shrink-0 text-brand-teal" />
    }
    if (lowerFeature.includes('album')) {
      return <BookOpen className="h-4 w-4 flex-shrink-0 text-brand-teal" />
    }
    if (lowerFeature.includes('cetak') || lowerFeature.includes('edited')) {
      return (
        <Image
          className="h-4 w-4 flex-shrink-0 text-brand-teal"
          aria-label="Print/edited feature"
        />
      )
    }
    return <span className="flex-shrink-0 text-sm text-brand-teal">✓</span>
  }

  return (
    <div
      className={`
        overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300
        ${isExpanded ? 'ring-2 ring-brand-teal' : 'hover:shadow-lg'}
      `}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between p-5 transition-colors hover:bg-gray-50"
      >
        <div className="flex-1 text-left">
          <div className="mb-2 flex items-center space-x-2">
            {categoryIcon && (
              <div className="text-brand-teal">{categoryIcon}</div>
            )}
            <h3 className="text-lg font-bold text-gray-900 md:text-xl">
              {pkg.name}
            </h3>
            {pkg.isBestSeller && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Best Seller
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-brand-teal md:text-3xl">
            {formatPrice(pkg.price)}
          </div>
        </div>
        <div className="ml-4">
          <ChevronDown
            className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${
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
        <div className="space-y-4 px-5 pb-5">
          {/* Description */}
          {pkg.description && (
            <p className="border-t pt-4 text-sm italic text-gray-600 md:text-base">
              {pkg.description}
            </p>
          )}

          {/* Highlight Features */}
          <div className="space-y-2.5">
            {highlightFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                {getFeatureIcon(feature)}
                <span className="text-sm leading-relaxed text-gray-700 md:text-base">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Additional Features (Collapsible) */}
          {remainingFeatures.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer items-center space-x-1 text-sm font-medium text-brand-teal hover:text-brand-teal/80">
                <span>Detail lengkap</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                {remainingFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-xs text-brand-teal">✓</span>
                    <span className="text-sm text-gray-600">{feature}</span>
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
