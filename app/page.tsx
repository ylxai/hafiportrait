import CinematicHero from './components/landing/mobile-first/CinematicHero'
import ModernServices from './components/landing/mobile-first/ModernServices'
import BentoGallery from './components/landing/mobile-first/BentoGallery'
import AccordionPricing from './components/landing/mobile-first/AccordionPricing'
import DigitalPosterEventList from './components/landing/mobile-first/DigitalPosterEventList'
import ConversationalForm from './components/landing/mobile-first/ConversationalForm'
import BottomNavigation from './components/landing/mobile-first/BottomNavigation'
import FloatingCTA from './components/landing/mobile-first/FloatingCTA'
import Footer from './components/landing/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Cinematic Hero with Auto-play Slideshow */}
      <CinematicHero />
      
      {/* Modern Services Section */}
      <ModernServices />
      
      {/* Bento Grid Gallery with Story Mode */}
      <BentoGallery />
      
      {/* Accordion Pricing Section */}
      <AccordionPricing />
      
      {/* Digital Poster Event List - NEW: Replaces About Section */}
      <DigitalPosterEventList />
      
      {/* Conversational Contact Form */}
      <ConversationalForm />
      
      {/* Footer - Fixed Wave Background */}
      <Footer />
      
      {/* Bottom Navigation (Mobile Only) */}
      <BottomNavigation />
      
      {/* Floating Action Button */}
      <FloatingCTA />
    </main>
  )
}
