'use client'

import { motion } from 'framer-motion'
import {
  CameraIcon,
  HeartIcon,
  GiftIcon,
  HandRaisedIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

const services = [
  {
    icon: CameraIcon,
    title: 'Wedding Photography',
    description:
      'Comprehensive wedding day coverage from preparation to celebration. Capturing every precious moment of your special day.',
    features: ['Full day coverage', 'Edited photos', 'Online gallery'],
  },
  {
    icon: HeartIcon,
    title: 'Prewedding',
    description:
      'Romantic couple session to capture your love story before the big day. Beautiful outdoor and studio options available.',
    features: ['Multiple outfits', 'Location variety', 'Styled photoshoot'],
  },
  {
    icon: UserGroupIcon,
    title: 'Couple Photography',
    description:
      'Professional couple portraits in controlled studio environment with professional lighting and backdrops.',
    features: ['Professional lighting', 'Multiple poses', 'High-res photos'],
  },
  {
    icon: GiftIcon,
    title: 'Ulang Tahun',
    description:
      'Birthday celebration photography to capture joy, laughter, and special moments with family and friends.',
    features: ['Party coverage', 'Candid moments', 'Group photos'],
  },
  {
    icon: HandRaisedIcon,
    title: 'Tasmiyah & Tasyakuran',
    description:
      'Professional documentation of Islamic ceremonies including Tasmiyah (naming ceremony) and Tasyakuran (gratitude celebration).',
    features: [
      'Cultural sensitivity',
      'Traditional moments',
      'Family portraits',
    ],
  },
  {
    icon: AcademicCapIcon,
    title: 'Wisuda',
    description:
      'Graduation ceremony photography capturing the pride and achievement of this important milestone.',
    features: ['Ceremony coverage', 'Portrait session', 'Family photos'],
  },
]

export default function ModernServices() {
  return (
    <section
      id="services"
      className="section bg-detra-dark py-20"
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
          <h2 className="mb-4 font-serif text-2xl font-bold text-white md:text-3xl">
            Our <span className="italic text-detra-gold">Services</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-detra-light md:text-base">
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
              className="group relative cursor-pointer rounded-2xl border border-detra-gray bg-detra-gray/80 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-detra-gold/30 hover:shadow-lg"
            >
              {/* Icon */}
              <div
                className="relative h-12 w-12 rounded-xl bg-detra-gold/10 md:h-14 md:w-14 mx-auto mb-3 flex transform items-center justify-center transition-transform duration-300 group-hover:scale-110"
              >
                <service.icon className="h-6 w-6 text-detra-gold md:h-7 md:w-7" />
              </div>

              {/* Service Name */}
              <div className="text-center">
                <h3 className="text-sm font-semibold leading-tight text-white transition-colors group-hover:text-detra-gold md:text-base">
                  {service.title}
                </h3>

                {/* Tap indicator */}
                <div className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="mx-auto h-1 w-1 rounded-full bg-detra-gold" />
                </div>
              </div>

              {/* Subtle hover effect */}
              <div
                className="absolute inset-0 bg-detra-gold rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-5"
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
          <p className="mb-3 text-xs text-white/60 md:text-sm">
            Tap service for details
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-detra-gold px-5 py-2.5 text-xs font-semibold text-detra-black transition-all duration-300 hover:scale-105 hover:bg-detra-gold/90 hover:shadow-lg md:text-sm"
          >
            <CameraIcon className="h-3 w-3 md:h-4 md:w-4" />
            Book Now
          </a>
        </motion.div>
      </div>
    </section>
  )
}
