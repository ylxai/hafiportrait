'use client'

import { motion } from 'framer-motion'
import { Award, Heart, Camera, Users } from 'lucide-react'
import Image from 'next/image'

export default function EditorialAbout() {
  return (
    <section id="about" className="section bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        {/* Center-aligned heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            About <span className="italic text-rose-500">Hafiportrait</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We capture life's most precious moments with an editorial eye and cinematic approach. 
            Every frame tells a story of love, joy, and celebration.
          </p>
        </motion.div>

        {/* Stats Grid - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">500+</div>
            <div className="text-gray-600 font-medium">Weddings Captured</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">1000+</div>
            <div className="text-gray-600 font-medium">Happy Couples</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">5+</div>
            <div className="text-gray-600 font-medium">Years Experience</div>
          </div>
        </motion.div>

        {/* Story Content - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full text-rose-600 font-semibold text-sm">
                <Camera className="w-4 h-4" />
                Our Story
              </div>

              <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight">
                Turning Moments Into
                <span className="block text-rose-500 italic mt-2">
                  Timeless Memories
                </span>
              </h3>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Hi, we're <strong className="text-gray-900">Hafiportrait</strong> — a team of passionate photographers dedicated to capturing the authentic emotions and beautiful details of your special day.
                </p>
                <p>
                  With over 5 years of experience and 500+ weddings under our belt, we've perfected the art of editorial-cinematic photography that tells your unique love story.
                </p>
                <p>
                  Our approach combines classic elegance with modern techniques, creating images that feel both timeless and contemporary — photos you'll treasure for generations.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    const element = document.getElementById('contact')
                    if (element) element.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
