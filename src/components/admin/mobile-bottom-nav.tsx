'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Camera, 
  Bell, 
  Palette,
  Home,
  Menu,
  Wifi,
  Image
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function MobileBottomNav({ activeTab, onTabChange, className }: MobileBottomNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: Home,
      emoji: '🏠'
    },
    {
      id: 'content',
      label: 'Konten',
      icon: Camera,
      emoji: '📸'
    },
    {
      id: 'photos',
      label: 'Foto',
      icon: Image,
      emoji: '🖼️'
    },
    {
      id: 'system',
      label: 'Sistem',
      icon: Bell,
      emoji: '🔔'
    },
    {
      id: 'customization',
      label: 'Tema',
      icon: Palette,
      emoji: '🎨'
    }
  ];

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white border-t border-gray-200 shadow-lg",
        "transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center",
                "w-full h-full py-2 px-1",
                "transition-all duration-200",
                "rounded-lg touch-manipulation",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                isActive ? [
                  "text-blue-600 bg-blue-50",
                  "scale-105"
                ] : [
                  "text-gray-600",
                  "hover:text-gray-900 hover:bg-gray-50",
                  "active:bg-gray-100"
                ]
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 mb-1 transition-transform",
                  isActive && "scale-110"
                )} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive ? "font-semibold" : "font-normal"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}