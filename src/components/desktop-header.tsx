'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { GradientText, FadeContent, REACTBITS_PRESETS } from '@/components/reactbits';
import { BeamsBackground } from '@/components/ui/beams-background';
import Logo from './logo';

interface DesktopHeaderProps {
  className?: string;
}

export default function DesktopHeader({ className = '' }: DesktopHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const navigation = [
    { name: 'Beranda', href: '/' },
    { name: 'Galeri', href: '#gallery' },
    { name: 'Events', href: '#events' },
    { name: 'Harga', href: '#pricing' },
    { name: 'Kontak', href: '#contact' },
  ];

  const contactInfo = [
    { icon: Phone, value: '+62 812-3456-7890', href: 'tel:+6281234567890' },
    { icon: Mail, value: 'hello@hafiportrait.com', href: 'mailto:hello@hafiportrait.com' },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/hafiportrait' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/hafiportrait' },
  ];

  return (
    <>
      {/* Top Contact Bar - Trend 2025: Glassmorphism */}
      <div className={`bg-gradient-primary text-white py-2 relative overflow-hidden transition-all duration-300 ${
        isScrolled ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center text-sm">
            <FadeContent className="flex items-center gap-6">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center gap-2 text-white hover:text-brand-secondary-light transition-all duration-300 hover:scale-105"
                >
                  <item.icon size={14} />
                  <span className="font-medium">{item.value}</span>
                </a>
              ))}
            </FadeContent>
            
            <FadeContent delay={200} className="flex items-center gap-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-brand-secondary-light transition-all duration-300 hover:scale-110 hover:rotate-12"
                  aria-label={link.name}
                >
                  <link.icon size={16} />
                </a>
              ))}
            </FadeContent>
          </div>
        </div>
      </div>

      {/* Main Header - Trend 2025: Glassmorphism Evolution */}
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? 'top-0' : 'top-[44px]'
        } ${className}`}
      >
        {/* Beams Background Effect */}
        <BeamsBackground className="absolute inset-0">
          {/* Glassmorphism Container */}
          <div 
            className={`relative backdrop-blur-xl border-b transition-all duration-500 ${
              isScrolled 
                ? 'bg-white/95 border-brand-border/50 shadow-brand-lg' 
                : 'bg-white/10 border-white/20'
            }`}
          >
            <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-20">
              
              {/* Logo with Morphing Animation */}
              <FadeContent>
                <div 
                  className="transform transition-all duration-300 hover:scale-105"
                  style={{
                    transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
                  }}
                >
                  <Logo 
                    size="md" 
                    variant="light"
                    className="cursor-pointer"
                  />
                </div>
              </FadeContent>

              {/* Navigation with Magnetic Hover Effects */}
              <nav className="flex items-center gap-8">
                {navigation.map((item, index) => (
                  <FadeContent key={item.name} delay={index * 100}>
                    <a
                      href={item.href}
                      className={`relative font-medium transition-all duration-300 hover:scale-110 group ${
                        isScrolled ? 'text-brand-text-primary hover:text-brand-primary' : 'text-white hover:text-brand-secondary-light'
                      }`}
                      onMouseEnter={(e) => {
                        // Magnetic effect
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = mousePosition.x - rect.left - rect.width / 2;
                        const y = mousePosition.y - rect.top - rect.height / 2;
                        e.currentTarget.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.1)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(0px, 0px) scale(1)';
                      }}
                    >
                      {item.name}
                      
                      {/* Animated underline */}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300"></span>
                      
                      {/* Glow effect */}
                      <span className="absolute inset-0 rounded-lg bg-brand-primary/10 scale-0 group-hover:scale-100 transition-transform duration-300 -z-10"></span>
                    </a>
                  </FadeContent>
                ))}
              </nav>

              {/* CTA Button with Gradient */}
              <FadeContent delay={500}>
                <button className="relative px-6 py-3 bg-gradient-primary text-white font-semibold rounded-full overflow-hidden group hover:shadow-brand-gradient transition-all duration-300">
                  <span className="relative z-10">Book Now</span>
                  
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-secondary scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </button>
              </FadeContent>
            </div>
            </div>
          </div>
        </BeamsBackground>
      </header>

      {/* Spacer untuk desktop header - contact bar + main header */}
      <div className="h-20" />
    </>
  );
}