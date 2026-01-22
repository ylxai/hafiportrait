'use client'

import { motion } from 'framer-motion'
import {
  TrophyIcon,
  HeartIcon,
  CameraIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function EditorialAbout() {
  return (
    <section
      id="about"
      className="section bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="container-custom">
        {/* Center-aligned heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-serif text-2xl font-bold text-white md:text-3xl">
            About <span className="italic text-detra-gold">Hafiportrait</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-detra-light">
            We capture life's most precious moments with an editorial eye and
            cinematic approach. Every frame tells a story of love, joy, and
            celebration.
          </p>
        </motion.div>

        {/* Stats Grid - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3"
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-detra-gold to-detra-gold">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
            <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
              500+
            </div>
            <div className="font-medium text-detra-light">Weddings Captured</div>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-detra-gold">
              <HeartIcon className="h-8 w-8 text-white" />
            </div>
            <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
              1000+
            </div>
            <div className="font-medium text-detra-light">Happy Couples</div>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500">
              <TrophyIcon className="h-8 w-8 text-white" />
            </div>
            <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
              5+
            </div>
            <div className="font-medium text-detra-light">Years Experience</div>
          </div>
        </motion.div>

        {/* Story Content - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto max-w-4xl"
        >
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=1000&auto=format&fit=crop"
                alt="Professional photographer at work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600">
                <CameraIcon className="h-4 w-4" />
                Our Story
              </div>

              <h3 className="font-serif text-3xl font-bold leading-tight text-white md:text-4xl">
                Turning Moments Into
                <span className="mt-2 block italic text-detra-gold">
                  Timeless Memories
                </span>
              </h3>

              <div className="space-y-4 leading-relaxed text-detra-light">
                <p>
                  Hi, we're{' '}
                  <strong className="text-white">Hafiportrait</strong> — a
                  team of passionate photographers dedicated to capturing the
                  authentic emotions and beautiful details of your special day.
                </p>
                <p>
                  With over 5 years of experience and 500+ weddings under our
                  belt, we've perfected the art of editorial-cinematic
                  photography that tells your unique love story.
                </p>
                <p>
                  Our approach combines classic elegance with modern techniques,
                  creating images that feel both timeless and contemporary —
                  photos you'll treasure for generations.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    const element = document.getElementById('contact')
                    if (element) element.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="transform rounded-full bg-gradient-to-r from-detra-gold to-detra-gold px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Let's Work Together
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
