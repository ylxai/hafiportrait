'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Pause, ArrowRight, Phone, Eye, Sparkles } from 'lucide-react';
import { OptimizedImage } from './ui/optimized-image';
import Logo from './logo';
import UniversalSkeleton from '@/components/reactbits/skeleton/UniversalSkeleton';
// Removed complex loading animations for better performance
// Removed complex scroll animations for better performance

interface SlideshowPhoto {
  id: string;
  url: string;
  original_name: string;
  optimized_images?: any;
}

interface HeroSlideshowProps {
  photos: SlideshowPhoto[];
  autoplay?: boolean;
  interval?: number;
  showControls?: boolean;
  className?: string;
}

// Simple reliable scroll function
const smoothScrollToSection = (sectionId: string, offset: number = 80) => {
  const targetId = sectionId.replace('#', '');
  const element = document.getElementById(targetId);
  
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const targetTop = rect.top + scrollTop - offset;
  
  window.scrollTo({
    top: targetTop,
    behavior: 'smooth'
  });
};

export default function HeroSlideshow({
  photos,
  autoplay = true,
  interval = 5000,
  showControls = true,
  className = ''
}: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  // Removed transition state for simplicity
  
  // Removed complex scroll animations for better performance
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  // Removed preloaded images state for simplicity
  
  // Dynamic text state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  // Dynamic main title state
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const mainTitles = [
    "Capture Momen Indah",
    "Save Beautiful Memories", 
    "Your Precious Moments",
    "Moments & Memories"
  ];
  
  const dynamicWords = [
    "Pernikahan Impian ✨",
    "Momen Keluarga 👨‍👩‍👧‍👦", 
    "Acara Corporate 🏢",
    "Ulang Tahun Spesial 🎂",
    "Wisuda Bersejarah 🎓"
  ];


  // Simplified auto-play functionality
  useEffect(() => {
    if (isPlaying && photos && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        goToNext();
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, photos, interval]);

  // Dynamic main title rotation (every 10 seconds)
  useEffect(() => {
    const titleInterval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % mainTitles.length);
    }, 10000); // Change every 10 seconds
    
    return () => clearInterval(titleInterval);
  }, [mainTitles.length]);

  // Simple dynamic text rotation (original version)
  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(textInterval);
  }, [dynamicWords.length]);

  // Removed preloading for simplicity and better performance

  // Simplified navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && photos.length > 1) {
      goToNext();
    }
    if (isRightSwipe && photos.length > 1) {
      goToPrevious();
    }
  };

  // Handle if no photos
  if (!photos || photos.length === 0) {
    return (
      <div className={`relative bg-white flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            HafiPortrait
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Professional Photography Services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => smoothScrollToSection('gallery', 100)}
              size="lg" 
              className="bg-brand-primary hover:bg-brand-primary-light text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Eye className="mr-2" size={20} />
              Portfolio
            </Button>
            <Button 
              onClick={() => smoothScrollToSection('pricing', 100)}
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-brand-primary font-semibold px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <Sparkles className="mr-2" size={20} />
              Harga
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image - Mobile Optimized */}
      <div className="absolute inset-0">
        {currentPhoto.optimized_images ? (
          <OptimizedImage
            images={currentPhoto.optimized_images}
            alt={currentPhoto.original_name}
            usage="mobile" // Use mobile-optimized version
            className="w-full h-full object-cover transition-all duration-500"
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
          />
        ) : (
          <img
            src={currentPhoto.url}
            alt={currentPhoto.original_name}
            className="w-full h-full object-cover transition-all duration-500"
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
          />
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/50" />

      {/* Logo - Fixed Position */}
      <div className="absolute top-4 left-4 z-30">
        <Logo 
          size="sm" 
          variant="light"
          className="flex-shrink-0"
        />
      </div>

      {/* Content - Mobile Optimized */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white space-y-4 md:space-y-6 max-w-4xl mx-auto px-4">
          <h1 
            className="text-3xl md:text-6xl lg:text-7xl font-bold mb-2 md:mb-4 animate-fade-in-up text-white"
          >
            <span className="transition-all duration-1000 ease-in-out">
              {mainTitles[currentTitleIndex]}
            </span>
          </h1>
          <p className="text-lg md:text-2xl lg:text-3xl mb-4 md:mb-8 animate-fade-in-up transition-all duration-500" style={{ animationDelay: '200ms' }}>
            {dynamicWords[currentWordIndex]}
          </p>
          <div className="flex flex-row gap-2 justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {/* Primary CTA - Portfolio */}
            <Button 
              onClick={() => smoothScrollToSection('gallery', 100)}
              size="sm" 
              className="group relative overflow-hidden bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 md:h-9 text-xs px-3 md:px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Eye className="w-3 h-3 group-hover:scale-125 transition-transform duration-300" />
                Portfolio
              </span>
              {/* Animated shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            </Button>

            {/* Secondary CTA - Harga */}
            <Button 
              onClick={() => smoothScrollToSection('pricing', 100)}
              size="sm" 
              variant="ghost" 
              className="group relative overflow-hidden border border-white/30 text-white hover:text-purple-400 h-8 md:h-9 text-xs px-3 md:px-4 rounded-lg font-bold backdrop-blur-md bg-black/20 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Sparkles className="w-3 h-3 group-hover:rotate-12 group-hover:scale-125 transition-all duration-300" />
                Harga
              </span>
              {/* Border glow */}
              <div className="absolute inset-0 rounded-xl border border-white/50 scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {showControls && photos && photos.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-30 hidden md:flex items-center justify-center"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-30 hidden md:flex items-center justify-center"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-brand-secondary scale-125 shadow-lg' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile Swipe Indicator */}
          <div className="absolute bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium bg-black/30 px-3 py-1 rounded-full md:hidden">
            ← Geser untuk navigasi →
          </div>
        </>
      )}

    </div>
  );
}