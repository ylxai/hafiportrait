'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'

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
          className="group relative transform rounded-full bg-gradient-to-r from-rose-400 to-pink-500 p-4 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-rose-500/50 active:scale-95"
        >
          <motion.div
            animate={{ rotate: showOptions ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <CalendarDaysIcon className="h-6 w-6" />
          </motion.div>

          {/* Pulse Animation */}
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-20" />
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
            className="group flex transform items-center gap-3 rounded-full bg-white p-3 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="rounded-full bg-green-500 p-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
            </div>
            <span className="whitespace-nowrap pr-3 text-sm font-semibold text-gray-800">
              WhatsApp
            </span>
          </motion.button>

          {/* Call */}
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handleCall}
            className="group flex transform items-center gap-3 rounded-full bg-white p-3 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="rounded-full bg-blue-500 p-2">
              <PhoneIcon className="h-5 w-5 text-white" />
            </div>
            <span className="whitespace-nowrap pr-3 text-sm font-semibold text-gray-800">
              Call Us
            </span>
          </motion.button>

          {/* Book Consultation */}
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleBooking}
            className="group flex transform items-center gap-3 rounded-full bg-white p-3 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="rounded-full bg-rose-500 p-2">
              <CalendarDaysIcon className="h-5 w-5 text-white" />
            </div>
            <span className="whitespace-nowrap pr-3 text-sm font-semibold text-gray-800">
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
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
        />
      )}
    </>
  )
}
