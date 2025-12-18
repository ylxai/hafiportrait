'use client'

import { motion } from 'framer-motion'
import { Camera, Heart, Cake, Sparkles, Users } from 'lucide-react'

const services = [
  {
    icon: Camera,
    title: 'Wedding Photography',
    description: 'Comprehensive wedding day coverage from preparation to celebration. Capturing every precious moment of your special day.',
    color: 'from-rose-400 to-pink-500',
    features: ['Full day coverage', 'Edited photos', 'Online gallery']
  },
  {
    icon: Heart,
    title: 'Prewedding',
    description: 'Romantic couple session to capture your love story before the big day. Beautiful outdoor and studio options available.',
    color: 'from-purple-400 to-pink-500',
    features: ['Multiple outfits', 'Location variety', 'Styled photoshoot']
  },
  {
    icon: Sparkles,
    title: 'Tasmiyah & Tasyakuran',
    description: 'Professional documentation of Islamic ceremonies including Tasmiyah (naming ceremony) and Tasyakuran (gratitude celebration).',
    color: 'from-teal-400 to-cyan-500',
    features: ['Cultural sensitivity', 'Traditional moments', 'Family portraits']
  },
  {
    icon: Cake,
    title: 'Ulang Tahun',
    description: 'Birthday celebration photography to capture joy, laughter, and special moments with family and friends.',
    color: 'from-amber-400 to-orange-500',
    features: ['Party coverage', 'Candid moments', 'Group photos']
  },
  {
    icon: Users,
    title: 'Studio Couple',
    description: 'Professional couple portraits in controlled studio environment with professional lighting and backdrops.',
    color: 'from-indigo-400 to-purple-500',
    features: ['Professional lighting', 'Multiple poses', 'High-res photos']
  }
]

export default function ModernServices() {
  return (
    <section id="services" className="section bg-gradient-to-b from-white to-rose-50/30">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-3">
            Our <span className="text-rose-500">Services</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Professional photography for your special moments
          </p>
        </motion.div>

        {/* Compact Services Grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // TODO: Show modal with service details
                alert(`${service.title}\n\n${service.description}\n\nFeatures:\n${service.features.join('\n• ')}`)
              }}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-rose-200"
            >
              {/* Icon */}
              <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3 mx-auto transform group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>

              {/* Service Name */}
              <div className="text-center">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-tight group-hover:text-rose-600 transition-colors">
                  {service.title}
                </h3>
                
                {/* Tap indicator */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-1 h-1 bg-rose-400 rounded-full mx-auto" />
                </div>
              </div>

              {/* Subtle hover effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>

        {/* Horizontal CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-gray-600 mb-3 text-xs md:text-sm">
            Tap service for details
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="#pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 text-xs md:text-sm"
            >
              <Camera className="w-3 h-3 md:w-4 md:h-4" />
              Price List
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 text-xs md:text-sm"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Our Gallery
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
