import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { RootErrorBoundary } from '@/components/error-boundaries'
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL('https://hafiportrait.photography'),
  title: 'Hafiportrait - Editorial Wedding Photography for Modern Couples',
  description:
    'Cinematic wedding photography with instant gallery access. Capturing authentic love stories with editorial-style imagery for Gen Z & Millennial couples.',
  keywords:
    'wedding photography, editorial photography, cinematic wedding, modern wedding photographer, Gen Z wedding, Banjar photographer, instant gallery, professional photographer, couple photography',
  authors: [{ name: 'Hafiportrait' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Hafiportrait - Editorial Wedding Photography',
    description: 'Cinematic wedding photography for modern couples',
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Hafiportrait',
    images: [
      {
        url: '/images/hafiportrait.png',
        width: 1200,
        height: 630,
        alt: 'Hafiportrait Photography',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hafiportrait - Editorial Wedding Photography',
    description: 'Cinematic wedding photography for modern couples',
    images: ['/images/hafiportrait.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Google Analytics Script */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-BESTMV5CN2"
          async
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BESTMV5CN2');
            `
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <RootErrorBoundary userType="guest">
          {children}
        </RootErrorBoundary>
        <ToastProvider />
      </body>
    </html>
  )
}
