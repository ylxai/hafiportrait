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

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-rose-500 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {service.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-6">
            Ready to book your session? Get in touch with us today!
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Camera className="w-5 h-5" />
            Book Now
          </a>
        </motion.div>
      </div>
    </section>
  )
}
