'use client'

import { useState } from 'react'
import { 
  ChevronDownIcon as ChevronDown, 
  PlusIcon as Plus 
} from '@heroicons/react/24/outline'

interface AdditionalService {
  id: string
  name: string
  price: number
  description?: string
}

interface AdditionalServicesProps {
  services: AdditionalService[]
}

export default function AdditionalServices({ services }: AdditionalServicesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="bg-detra-gray rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-start justify-between cursor-pointer hover:bg-detra-dark transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-3 mb-3">
            <Plus className="w-6 h-6 text-detra-gold flex-shrink-0" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Layanan Tambahan
            </h3>
          </div>
          <p className="text-sm md:text-base text-detra-light leading-relaxed">
            Layanan tambahan dapat dikombinasikan dengan paket utama & Digital
          </p>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-detra-light transition-transform duration-300 flex-shrink-0 ml-4 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-6 pb-6">
          <div className="border-t pt-5 space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-brand-teal hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-base md:text-lg font-medium text-white mb-1">
                      {service.name}
                    </h4>
                    {service.description && (
                      <p className="text-base text-detra-light mt-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <span className="text-base md:text-lg font-semibold text-detra-gold whitespace-nowrap">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
