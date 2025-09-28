/**
 * Color Palette Demo Component
 * Demonstrates the dynamic color palette system
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Heart, Star, Users, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPaletteSwitcher } from '@/components/ui/color-palette-switcher';
import { useColorPalette } from '@/hooks/use-color-palette';

export function ColorPaletteDemo() {
  const { currentPalette, availablePalettes } = useColorPalette();

  return (
    <div className="min-h-screen bg-gradient-dynamic-hero">
      {/* Floating Color Switcher */}
      <ColorPaletteSwitcher variant="floating" />
      
      {/* Header Demo */}
      <header className="bg-dynamic-secondary shadow-dynamic border-b border-dynamic sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Camera className="w-7 h-7 text-dynamic-accent" />
              <span className="text-xl font-bold text-dynamic-primary">HafiPortrait</span>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <ColorPaletteSwitcher variant="button" size="sm" showLabel={false} />
              <Button className="btn-dynamic-primary">
                📞 Contact
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Demo */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-dynamic-primary">
              <span className="block">Abadikan</span>
              <span className="block text-dynamic-accent">Momen Terindah</span>
            </h1>
            
            <p className="text-xl text-dynamic-secondary max-w-2xl mx-auto">
              Platform berbagi foto untuk event spesial Anda dengan teknologi terdepan
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-dynamic-primary text-lg py-6 px-8">
                <Camera className="w-6 h-6 mr-2" />
                📞 Hubungi Kami
              </Button>
              <Button className="btn-dynamic-secondary text-lg py-6 px-8">
                <Heart className="w-6 h-6 mr-2" />
                💫 Lihat Portfolio
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Demo */}
      <section className="py-16 px-4 bg-dynamic-secondary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-dynamic-primary mb-12">
            Fitur Unggulan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "Upload Mudah", 
                description: "Tamu upload foto langsung dari smartphone dengan mudah",
                color: "text-dynamic-accent"
              },
              { 
                icon: Users, 
                title: "Berbagi Instan", 
                description: "Real-time sharing dengan watermark otomatis yang professional",
                color: "text-dynamic-accent"
              },
              { 
                icon: Award, 
                title: "Kualitas Tinggi", 
                description: "Semua foto tersimpan dalam kualitas tinggi untuk kenangan abadi",
                color: "text-dynamic-accent"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="card-dynamic rounded-2xl p-6 text-center"
              >
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-dynamic-button flex items-center justify-center mx-auto mb-4"
                >
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-dynamic-primary">{item.title}</h3>
                <p className="text-dynamic-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Palette Info */}
      <section className="py-16 px-4 bg-dynamic-accent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-dynamic-primary mb-8">
            🎨 Dynamic Color Themes
          </h2>
          
          <div className="card-dynamic rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-semibold text-dynamic-primary mb-4">
              Current Theme: {currentPalette.name}
            </h3>
            <p className="text-dynamic-secondary mb-6">
              {currentPalette.description}
            </p>
            
            {/* Color Preview */}
            <div className="flex justify-center gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                style={{ backgroundColor: currentPalette.colors.accentPrimary }}
                title="Primary Accent"
              />
              <div 
                className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                style={{ backgroundColor: currentPalette.colors.accentSecondary }}
                title="Secondary Accent"
              />
              <div 
                className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                style={{ backgroundColor: currentPalette.colors.accentGold }}
                title="Gold Accent"
              />
            </div>
            
            <ColorPaletteSwitcher variant="inline" showLabel={false} />
          </div>

          {/* Palette Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-dynamic rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-dynamic-accent mb-2">
                {availablePalettes.length}
              </div>
              <div className="text-dynamic-secondary">
                Total Themes
              </div>
            </div>
            <div className="card-dynamic rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-dynamic-accent mb-2">
                🏆
              </div>
              <div className="text-dynamic-secondary">
                Recommended
              </div>
            </div>
            <div className="card-dynamic rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-dynamic-accent mb-2">
                📱
              </div>
              <div className="text-dynamic-secondary">
                Mobile First
              </div>
            </div>
          </div>

          {/* Recommended Palettes */}
          <div className="card-dynamic rounded-2xl p-8">
            <h4 className="text-lg font-semibold text-dynamic-primary mb-4">
              🏆 Recommended for Photography Business
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePalettes.filter(p => p.name.includes('🏆') || 
                ['elegant-photography', 'champagne-gold', 'rose-gold-premium', 'vintage-sepia'].includes(p.id)
              ).map((palette, index) => (
                <div 
                  key={palette.id}
                  className="p-4 rounded-lg border-2 border-dynamic cursor-pointer hover:shadow-lg transition-all"
                  style={{ 
                    background: palette.gradients.card,
                    borderColor: currentPalette.id === palette.id ? palette.colors.accentPrimary : 'transparent'
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: palette.colors.accentPrimary }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: palette.colors.accentSecondary }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: palette.colors.accentGold }}
                      />
                    </div>
                    {index === 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">BEST</span>}
                  </div>
                  <h5 className="font-medium text-sm" style={{ color: palette.colors.textPrimary }}>
                    {palette.name}
                  </h5>
                  <p className="text-xs opacity-75" style={{ color: palette.colors.textSecondary }}>
                    {palette.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-dynamic-muted">
            Pilih tema warna yang sesuai dengan preferensi Anda. 
            Perubahan akan tersimpan otomatis dan diterapkan ke seluruh website.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-dynamic-hero">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-dynamic-primary">
              Siap untuk Event Anda?
            </h2>
            
            <p className="text-xl text-dynamic-secondary">
              Hubungi kami sekarang untuk konsultasi gratis dan penawaran terbaik
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-dynamic-primary text-lg py-6 px-8 transform hover:scale-105 transition-transform">
                <Star className="w-6 h-6 mr-2" />
                💬 Chat WhatsApp
              </Button>
              <Button className="btn-dynamic-secondary text-lg py-6 px-8">
                📧 Email Kami
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}