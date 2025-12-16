'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MessageCircle, Phone } from 'lucide-react'

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBooking = () => {
    const contactSection = document.getElementById('contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleWhatsApp = () => {
    window.open('https://wa.me/6289570050319', '_blank')
  }

  const handleCall = () => {
    window.location.href = 'tel:+6289570050319'
  }

  if (!isVisible) return null

  return (
    <>
      {/* Main FAB */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-24 right-6 z-40 md:bottom-8"
      >
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="group relative p-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-rose-500/50 transition-all duration-300 transform hover:scale-110 active:scale-95"
        >
          <motion.div
            animate={{ rotate: showOptions ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Calendar className="w-6 h-6" />
          </motion.div>
          
          {/* Pulse Animation */}
          <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />
        </button>
      </motion.div>

      {/* Action Options */}
      {showOptions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-40 right-6 z-40 flex flex-col gap-3 md:bottom-24"
        >
          {/* WhatsApp */}
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={handleWhatsApp}
            className="group flex items-center gap-3 p-3 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="p-2 bg-green-500 rounded-full">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="pr-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
              WhatsApp
            </span>
          </motion.button>

          {/* Call */}
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handleCall}
            className="group flex items-center gap-3 p-3 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="p-2 bg-blue-500 rounded-full">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="pr-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
              Call Us
            </span>
          </motion.button>

          {/* Book Consultation */}
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleBooking}
            className="group flex items-center gap-3 p-3 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="p-2 bg-rose-500 rounded-full">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="pr-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
              Book Now
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Backdrop */}
      {showOptions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowOptions(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
        />
      )}
    </>
  )
}
