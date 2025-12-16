import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/providers/ToastProvider'

export const metadata: Metadata = {
  title: 'Hafiportrait - Editorial Wedding Photography for Modern Couples',
  description: 'Cinematic wedding photography with instant gallery access. Capturing authentic love stories with editorial-style imagery for Gen Z & Millennial couples.',
  keywords: 'wedding photography, editorial photography, cinematic wedding, modern wedding photographer, Gen Z wedding, Banjar photographer, instant gallery, professional photographer, couple photography',
  authors: [{ name: 'Hafiportrait' }],
  openGraph: {
    title: 'Hafiportrait - Editorial Wedding Photography',
    description: 'Cinematic wedding photography for modern couples',
    type: 'website',
    locale: 'id_ID',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hafiportrait Photography'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hafiportrait - Editorial Wedding Photography',
    description: 'Cinematic wedding photography for modern couples',
    images: ['/og-image.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#fb7185',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#fb7185" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
