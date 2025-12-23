'use client'

import { motion } from 'framer-motion'
import {
  CameraIcon,
  HeartIcon,
  GiftIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

const services = [
  {
    icon: CameraIcon,
    title: 'Wedding Photography',
    description:
      'Comprehensive wedding day coverage from preparation to celebration. Capturing every precious moment of your special day.',
    color: 'from-rose-400 to-pink-500',
    features: ['Full day coverage', 'Edited photos', 'Online gallery'],
  },
  {
    icon: HeartIcon,
    title: 'Prewedding',
    description:
      'Romantic couple session to capture your love story before the big day. Beautiful outdoor and studio options available.',
    color: 'from-purple-400 to-pink-500',
    features: ['Multiple outfits', 'Location variety', 'Styled photoshoot'],
  },
  {
    icon: SparklesIcon,
    title: 'Tasmiyah & Tasyakuran',
    description:
      'Professional documentation of Islamic ceremonies including Tasmiyah (naming ceremony) and Tasyakuran (gratitude celebration).',
    color: 'from-teal-400 to-cyan-500',
    features: [
      'Cultural sensitivity',
      'Traditional moments',
      'Family portraits',
    ],
  },
  {
    icon: GiftIcon,
    title: 'Ulang Tahun',
    description:
      'Birthday celebration photography to capture joy, laughter, and special moments with family and friends.',
    color: 'from-amber-400 to-orange-500',
    features: ['Party coverage', 'Candid moments', 'Group photos'],
  },
  {
    icon: UsersIcon,
    title: 'Studio Couple',
    description:
      'Professional couple portraits in controlled studio environment with professional lighting and backdrops.',
    color: 'from-indigo-400 to-purple-500',
    features: ['Professional lighting', 'Multiple poses', 'High-res photos'],
  },
]

export default function ModernServices() {
  return (
    <section
      id="services"
      className="section bg-gradient-to-b from-white to-rose-50/30"
    >
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-serif text-2xl font-bold text-slate-900 md:text-3xl">
            Our <span className="italic text-rose-500">Services</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
            Professional photography for your special moments
          </p>
        </motion.div>

        {/* Compact Services Grid */}
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 md:grid-cols-5">
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
                alert(
                  `${service.title}\n\n${service.description}\n\nFeatures:\n${service.features.join('\n• ')}`
                )
              }}
              className="group relative cursor-pointer rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-rose-200 hover:shadow-lg"
            >
              {/* Icon */}
              <div
                className={`relative h-12 w-12 rounded-xl bg-gradient-to-br md:h-14 md:w-14 ${service.color} mx-auto mb-3 flex transform items-center justify-center transition-transform duration-300 group-hover:scale-110`}
              >
                <service.icon className="h-6 w-6 text-white md:h-7 md:w-7" />
              </div>

              {/* Service Name */}
              <div className="text-center">
                <h3 className="text-sm font-semibold leading-tight text-gray-900 transition-colors group-hover:text-rose-600 md:text-base">
                  {service.title}
                </h3>

                {/* Tap indicator */}
                <div className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="mx-auto h-1 w-1 rounded-full bg-rose-400" />
                </div>
              </div>

              {/* Subtle hover effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.color} rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />
            </motion.div>
          ))}
        </div>

        {/* Horizontal CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="mb-3 text-xs text-gray-600 md:text-sm">
            Tap service for details
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-xs font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg md:text-sm"
          >
            <CameraIcon className="h-3 w-3 md:h-4 md:w-4" />
            Book Now
          </a>
        </motion.div>
      </div>
    </section>
  )
}
