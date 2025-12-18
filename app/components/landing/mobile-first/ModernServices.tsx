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
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Our <span className="italic text-rose-500">Services</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional photography services tailored to capture your most precious moments
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

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-600 mb-4 text-sm">
            Tap any service above for details
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm"
          >
            <Camera className="w-4 h-4" />
            Book Session
          </a>
        </motion.div>
      </div>
    </section>
  )
}
