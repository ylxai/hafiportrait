'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  packageName: string
  categoryName: string
  price: number
}

export default function WhatsAppButton({
  packageName,
  categoryName,
  price,
}: WhatsAppButtonProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const generateWhatsAppLink = () => {
    const message = `Halo, saya tertarik dengan paket ${packageName} - ${categoryName} seharga ${formatPrice(price)}. Bisa dijelaskan detail lebih lanjut?`
    const encodedMessage = encodeURIComponent(message)
    
    // Using kirimwa.id as specified
    return `https://kirimwa.id/hafiportraits?text=${encodedMessage}`
  }

  return (
    <a
      href={generateWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="
        w-full flex items-center justify-center space-x-2
        bg-green-500 hover:bg-green-600 
        text-white font-semibold 
        py-3.5 px-6 rounded-lg 
        transition-all duration-200
        shadow-md hover:shadow-lg
        active:scale-95
      "
    >
      <MessageCircle className="w-5 h-5" />
      <span>Chat WhatsApp — {packageName}</span>
    </a>
  )
}
