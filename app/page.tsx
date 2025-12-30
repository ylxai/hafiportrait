import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL('https://hafiportrait.photography'),
  title: 'Hafiportrait - Editorial Wedding Photography for Modern Couples',
  description:
    'Cinematic wedding photography with instant gallery access. Capturing authentic love stories with editorial-style imagery for Gen Z & Millennial couples.',
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

export default function HomePage() {
  return <HomeClient />
}
