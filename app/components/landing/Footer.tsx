'use client'

import { Instagram, Facebook, Mail, ArrowUp, Camera, Heart } from 'lucide-react'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-cyan rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-blue rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-cyan to-brand-teal rounded-xl flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Hafiportrait</h3>
            </div>
            <p className="text-white/70 leading-relaxed mb-6 max-w-md">
              Professional wedding & portrait photography dengan instant gallery platform. 
              Capturing life's most precious moments dengan artistic vision dan teknologi modern.
            </p>
            <div className="flex items-center gap-2 text-brand-cyan">
              <Heart className="w-5 h-5 fill-current" />
              <span className="text-sm">Crafted with love in Kelampaian Tengah, Banjar, Kalimantan Selatan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-white/70 hover:text-brand-cyan transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-brand-cyan rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Services
                </a>
              </li>
              <li>
                <a href="#portfolio" className="text-white/70 hover:text-brand-cyan transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-brand-cyan rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Portfolio
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-white/70 hover:text-brand-cyan transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-brand-cyan rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Pricing
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/70 hover:text-brand-cyan transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-brand-cyan rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-4">Get in Touch</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:dev@hafiportrait.photography" className="text-white/70 hover:text-brand-cyan transition-colors flex items-center gap-3 group">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">dev@hafiportrait.photography</span>
                </a>
              </li>
              <li>
                <a href="tel:+6289570050319" className="text-white/70 hover:text-brand-cyan transition-colors text-sm">
                  +62895-7005-03193
                </a>
              </li>
              <li className="text-white/70 text-sm">
                Kelampaian Tengah, Banjar, Kalimantan Selatan
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/hafiportrait"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/hafiportrait"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://wa.me/6289570050319"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-green-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <p className="text-white/60 text-sm text-center md:text-left">
              © {currentYear} Hafiportrait Photography. All rights reserved.
            </p>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 transform hover:scale-105"
              aria-label="Back to top"
            >
              <span className="text-sm text-white/70 group-hover:text-white">Back to Top</span>
              <ArrowUp className="w-4 h-4 text-white/70 group-hover:text-white group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Fixed Wave Decoration - Full Width */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-16"
          style={{ display: 'block' }}
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0V0Z"
            className="fill-white opacity-5"
          />
        </svg>
      </div>
    </footer>
  )
}
