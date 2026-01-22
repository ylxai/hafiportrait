'use client'

import { useState, useEffect } from 'react'
import { 
  CameraIcon as Camera, 
  TagIcon as Tag, 
  CalendarIcon as Calendar, 
  PhoneIcon as Phone 
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  is_active: boolean
}

function NavItem({ icon, label, onClick, is_active }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-300 ${
        is_active ? 'text-detra-gold' : 'text-detra-light'
      }`}
    >
      <motion.div
        whileTap={{ scale: 0.9 }}
        className="relative"
      >
        {icon}
        {is_active && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-rose-500 rounded-full"
          />
        )}
      </motion.div>
      <span className={`text-xs font-medium ${is_active ? 'font-semibold' : ''}`}>
        {label}
      </span>
    </button>
  )
}

export default function BottomNavigation() {
  const [activeSection, setActiveSection] = useState('portfolio')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)

      // Detect active section - UPDATED: Removed 'about'
      const sections = ['portfolio', 'pricing', 'events', 'contact']
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setActiveSection(sectionId)
    }
  }

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-detra-black/95 backdrop-blur-lg border-t border-detra-gray shadow-2xl md:hidden"
    >
      <div className="flex justify-around items-center px-2 safe-bottom">
        <NavItem
          icon={<Camera className="w-5 h-5" />}
          label="Portfolio"
          onClick={() => scrollToSection('portfolio')}
          is_active={activeSection === 'portfolio'}
        />
        <NavItem
          icon={<Tag className="w-5 h-5" />}
          label="Pricing"
          onClick={() => scrollToSection('pricing')}
          is_active={activeSection === 'pricing'}
        />
        <NavItem
          icon={<Calendar className="w-5 h-5" />}
          label="Events"
          onClick={() => scrollToSection('events')}
          is_active={activeSection === 'events'}
        />
        <NavItem
          icon={<Phone className="w-5 h-5" />}
          label="Contact"
          onClick={() => scrollToSection('contact')}
          is_active={activeSection === 'contact'}
        />
      </div>
    </motion.nav>
  )
}
