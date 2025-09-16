import React from 'react';
import Header from "@/components/header";
import Footer from "@/components/footer";
import SpotlightPricingSection from "@/components/spotlight-pricing-section";
import PricingSection from "@/components/modern-glassmorphism-pricing";
import { Button } from "@/components/ui/button";

export default function PricingDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="relative">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-neutral-900 to-black text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pricing Components <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Demo</span>
            </h1>
            <p className="text-xl text-neutral-300 mb-8">
              Bandingkan dua style pricing yang berbeda untuk website photography Anda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => document.getElementById('spotlight')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Lihat Spotlight Cards
              </Button>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('glassmorphism')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-neutral-600 text-white hover:bg-neutral-800"
              >
                Lihat Glassmorphism
              </Button>
            </div>
          </div>
        </section>

        {/* Spotlight Pricing Section */}
        <div id="spotlight">
          <div className="py-12 px-4 bg-neutral-100">
            <div className="max-w-4xl mx-auto text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                🌟 Spotlight Card Style
              </h2>
              <p className="text-neutral-600">
                Efek spotlight yang mengikuti mouse dengan dark theme yang elegan
              </p>
            </div>
          </div>
          <SpotlightPricingSection />
        </div>

        {/* Glassmorphism Pricing Section */}
        <div id="glassmorphism">
          <div className="py-12 px-4 bg-neutral-100">
            <div className="max-w-4xl mx-auto text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                ✨ Glassmorphism Style
              </h2>
              <p className="text-neutral-600">
                Design glassmorphism dengan efek blur yang modern
              </p>
            </div>
          </div>
          <PricingSection />
        </div>

        {/* Comparison Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-neutral-50 to-neutral-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
              Perbandingan Features
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Spotlight Card Features */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Spotlight Cards
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Interactive Spotlight Effect</strong>
                      <p className="text-neutral-600 text-sm">Efek spotlight yang mengikuti mouse movement</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Dark Theme Optimized</strong>
                      <p className="text-neutral-600 text-sm">Perfect untuk brand yang modern dan elegant</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Hover Scale Animation</strong>
                      <p className="text-neutral-600 text-sm">Card scaling saat hover untuk feedback visual</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Custom Spotlight Colors</strong>
                      <p className="text-neutral-600 text-sm">Setiap tier punya warna spotlight berbeda</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>ReactBits Component</strong>
                      <p className="text-neutral-600 text-sm">Built dengan komponen modern dari ReactBits</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Glassmorphism Features */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Glassmorphism
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Glass Effect Design</strong>
                      <p className="text-neutral-600 text-sm">Efek kaca dengan backdrop blur yang trendy</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Light Theme Friendly</strong>
                      <p className="text-neutral-600 text-sm">Cocok untuk website dengan light background</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Gradient Backgrounds</strong>
                      <p className="text-neutral-600 text-sm">Background gradien yang eye-catching</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Floating Animation</strong>
                      <p className="text-neutral-600 text-sm">Animasi floating yang subtle dan smooth</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <strong>Established Design</strong>
                      <p className="text-neutral-600 text-sm">Design yang sudah proven dan familiar</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-neutral-600 mb-6">
                Pilih style yang paling sesuai dengan brand dan preferensi Anda
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                Kembali ke Homepage
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}