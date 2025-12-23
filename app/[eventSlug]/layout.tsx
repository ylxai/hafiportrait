import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Metadata } from 'next'

// Font serif elegan untuk judul dan nuansa editorial (Hanya di Event)
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
})

// Font sans untuk UI controls
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Event Gallery | Hafiportrait',
  description: 'Exclusive wedding gallery access.',
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cormorant.variable} ${inter.variable} font-sans antialiased min-h-screen bg-neutral-50 selection:bg-rose-200 selection:text-rose-900`}>
      {children}
    </div>
  )
}
