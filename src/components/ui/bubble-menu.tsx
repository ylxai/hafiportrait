'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Image, Calendar, DollarSign, Phone } from 'lucide-react';
import { FadeContent } from '@/components/reactbits';

interface BubbleMenuProps {
  isScrolled: boolean;
  className?: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

export default function BubbleMenu({ isScrolled, className = '' }: BubbleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { name: 'Beranda', href: '#home', icon: Home, color: 'from-brand-secondary to-brand-primary' },
    { name: 'Events', href: '#events', icon: Calendar, color: 'from-brand-accent to-brand-secondary' },
    { name: 'Galeri', href: '#gallery', icon: Image, color: 'from-brand-primary to-brand-accent' },
    { name: 'Harga', href: '#pricing', icon: DollarSign, color: 'from-brand-secondary to-brand-primary' },
    { name: 'Kontak', href: '#contact', icon: Phone, color: 'from-brand-primary to-brand-secondary' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.bubble-menu-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuClick = (href: string) => {
    setIsOpen(false);
    
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (href.startsWith('#')) {
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop - 80;
        
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <div className={`bubble-menu-container fixed top-4 right-4 z-50 ${className}`}>
      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bubble-toggle relative w-14 h-14 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-lg text-gray-700' 
            : 'bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl text-white'
        }`}
        aria-label="Toggle menu"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-secondary/20 to-brand-primary/20"></div>
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </div>
      </button>

      {/* Bubble Menu Items */}
      {isOpen && (
        <div className="absolute top-16 right-0 space-y-3">
          {menuItems.map((item, index) => (
            <FadeContent key={item.name} delay={index * 50}>
              <button
                onClick={() => handleMenuClick(item.href)}
                className={`bubble-item group relative flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[140px] ${
                  isScrolled
                    ? 'bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-lg text-gray-700 hover:shadow-xl'
                    : 'bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl text-white hover:bg-white/30'
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                
                {/* Icon */}
                <div className={`relative z-10 p-2 rounded-full bg-gradient-to-r ${item.color} text-white shadow-md`}>
                  <item.icon size={16} />
                </div>
                
                {/* Text */}
                <span className="relative z-10 font-medium text-sm whitespace-nowrap">
                  {item.name}
                </span>
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </FadeContent>
          ))}
        </div>
      )}

      {/* Backdrop Blur Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}