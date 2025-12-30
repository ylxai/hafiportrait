'use client'

import { useEffect } from 'react'
import CinematicHero from './components/landing/mobile-first/CinematicHero'
import ModernServices from './components/landing/mobile-first/ModernServices'
import BentoGallery from './components/landing/mobile-first/BentoGallery'
import AccordionPricing from './components/landing/mobile-first/AccordionPricing'
import DigitalPosterEventList from './components/landing/mobile-first/DigitalPosterEventList'
import ConversationalForm from './components/landing/mobile-first/ConversationalForm'
import BottomNavigation from './components/landing/mobile-first/BottomNavigation'
import FloatingCTA from './components/landing/mobile-first/FloatingCTA'
import Footer from './components/landing/Footer'

export default function HomeClient() {
  // Force scroll to top on mount to prevent browser scroll restoration
  useEffect(() => {
    if (!window.location.hash) {
      window.history.scrollRestoration = 'manual'
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <CinematicHero />
      <ModernServices />
      <BentoGallery />
      <AccordionPricing />
      <DigitalPosterEventList />
      <ConversationalForm />
      <Footer />
      <BottomNavigation />
      <FloatingCTA />
    </main>
  )
}
