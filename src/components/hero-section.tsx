'use client';

import { Button } from "@/components/ui/button"; 
import { Camera, Heart, Share2, Sparkles, Zap, Users, Star, Award, Clock, Shield, Phone, ArrowRight, Eye } from "lucide-react";
import { motion, Easing } from "framer-motion";
import { useState, useEffect } from "react";

export default function HeroSection() {
  // State untuk dynamic content
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Dynamic words untuk typing effect
  const dynamicWords = [
    "Pernikahan Impian ✨",
    "Momen Keluarga 👨‍👩‍👧‍👦", 
    "Acara Corporate 🏢",
    "Ulang Tahun Spesial 🎂",
    "Wisuda Bersejarah 🎓"
  ];

  // Enhanced easing untuk animasi yang lebih smooth
  const easeOutCubicBezier: Easing = [0, 0, 0.58, 1];
  const bounceEasing: Easing = [0.68, -0.55, 0.265, 1.55];

  // Auto-change dynamic words
  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Stats counter animation
  const [stats, setStats] = useState({ events: 0, photos: 0, clients: 0 });
  
  useEffect(() => {
    const animateStats = () => {
      const targetStats = { events: 100, photos: 50000, clients: 100 };
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setStats({
          events: Math.floor(targetStats.events * progress),
          photos: Math.floor(targetStats.photos * progress),
          clients: Math.floor(targetStats.clients * progress)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setStats(targetStats);
        }
      }, stepDuration);
    };
    
    const timeout = setTimeout(animateStats, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Enhanced animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 1, 
        ease: bounceEasing,
        staggerChildren: 0.2
      } 
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: easeOutCubicBezier,
        delay: 0.3
      } 
    },
  };

  const featureTagVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: bounceEasing,
        delay: 0.5
      } 
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: easeOutCubicBezier, 
        delay: 0.7 
      } 
    },
  };

  const iconCardVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateX: 90 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.7,
        ease: easeOutCubicBezier,
        delay: 0.9 + i * 0.15,
      },
    }),
  };

  return (
    <section className="bg-gradient-dynamic-hero py-12 sm:py-16 lg:py-20 relative overflow-hidden min-h-[95vh] flex items-center">
      {/* Enhanced Background dengan Multiple Layers */}
      <div className="absolute inset-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dynamic-primary/10 via-dynamic-accent/5 to-dynamic-secondary/10 animate-pulse"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-dynamic-accent/10 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-dynamic-accent/15 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-dynamic-accent/20 rotate-45 blur-md animate-spin" style={{animationDuration: '20s'}}></div>
        
        {/* Dynamic floating particles */}
        {isVisible && [...Array(8)].map((_, i) => {
          // Use deterministic values based on index to avoid hydration mismatch
          const sizes = [6, 8, 10, 12, 14, 16, 18, 20];
          const positions = [
            { top: '10%', left: '15%' },
            { top: '25%', left: '85%' },
            { top: '45%', left: '10%' },
            { top: '60%', left: '90%' },
            { top: '75%', left: '20%' },
            { top: '30%', left: '70%' },
            { top: '80%', left: '60%' },
            { top: '15%', left: '45%' }
          ];
          const delays = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
          const durations = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5];
          
          return (
            <div
              key={i}
              className="absolute bg-dynamic-accent/20 rounded-full animate-bounce"
              style={{
                width: `${sizes[i]}px`,
                height: `${sizes[i]}px`,
                top: positions[i].top,
                left: positions[i].left,
                animationDelay: `${delays[i]}s`,
                animationDuration: `${durations[i]}s`
              }}
            />
          );
        })}
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center">
          {/* Enhanced Mobile-First Title dengan Dynamic Content */}
          <motion.div
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-dynamic-primary leading-tight">
              <motion.span 
                className="block mb-2"
                variants={titleVariants}
              >
                Abadikan Momen
              </motion.span>
              <motion.span 
                className="text-dynamic-accent block bg-gradient-to-r from-dynamic-accent via-dynamic-accent to-dynamic-accent bg-clip-text text-transparent mb-4"
                variants={titleVariants}
              >
                Terindah Anda ✨
              </motion.span>
              
              {/* Dynamic Typing Effect */}
              <motion.div
                variants={titleVariants}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-dynamic-secondary/80 min-h-[2em] flex items-center justify-center"
              >
                <span className="mr-2">Untuk</span>
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.5, ease: bounceEasing }}
                  className="text-dynamic-accent font-black"
                >
                  {dynamicWords[currentWordIndex]}
                </motion.span>
              </motion.div>
            </h1>
          </motion.div>

          {/* Real-time Stats Counter */}
          <motion.div
            variants={featureTagVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 sm:mb-8"
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-dynamic-accent">
                  {stats.events.toLocaleString()}+
                </div>
                <div className="text-sm sm:text-base text-dynamic-secondary font-medium">
                  Event Sukses
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-dynamic-accent">
                  {stats.photos.toLocaleString()}+
                </div>
                <div className="text-sm sm:text-base text-dynamic-secondary font-medium">
                  Foto Terupload
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-dynamic-accent">
                  {stats.clients.toLocaleString()}+
                </div>
                <div className="text-sm sm:text-base text-dynamic-secondary font-medium">
                  Klien Puas
                </div>
              </div>
            </div>
          </motion.div>
          

          {/* Enhanced Gradient Glow CTA Buttons */}
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 mb-8 sm:mb-12"
          >
            {/* Primary CTA - Hubungi Kami */}
            <Button 
              asChild
              size="lg" 
              className="group relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold text-base sm:text-lg py-5 sm:py-6 px-8 sm:px-10 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto border-0 before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
            >
              <a href="#contact" className="flex items-center justify-center gap-3 relative z-10">
                <div className="relative">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping group-hover:animate-bounce"></div>
                </div>
                Hubungi Kami
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse group-hover:animate-spin" />
              </a>
            </Button>
            
            {/* Secondary CTA - Portfolio */}
            <Button 
              asChild
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white font-bold text-base sm:text-lg py-5 sm:py-6 px-8 sm:px-10 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto border-0 before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
            >
              <a href="#gallery" className="flex items-center justify-center gap-3 relative z-10">
                <div className="relative">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping group-hover:animate-bounce animation-delay-200"></div>
                </div>
                Portfolio
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse group-hover:animate-bounce text-pink-200" />
              </a>
            </Button>
          </motion.div>

          {/* Mobile-First Trust Indicators */}
          <motion.div
            variants={featureTagVariants}
            initial="hidden"
            animate="visible"
            className="mb-8 sm:mb-12"
          >
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-dynamic-secondary/80 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-dynamic-accent" />
                <span className="font-medium">100+ Event</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-dynamic-accent" />
                <span className="font-medium">Kualitas Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-dynamic-accent" />
                <span className="font-medium">Upload Instan</span>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Mobile-First Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-0">
            {[
              { 
                icon: Camera, 
                title: "Upload Mudah", 
                description: "Tamu dapat langsung upload foto melalui smartphone dengan sekali klik",
                emoji: "📱",
                gradient: "from-blue-500 to-purple-600",
                bgColor: "bg-blue-50"
              },
              { 
                icon: Share2, 
                title: "Berbagi Instan", 
                description: "Bagikan momen spesial secara real-time dengan watermark otomatis profesional",
                emoji: "⚡",
                gradient: "from-green-500 to-teal-600",
                bgColor: "bg-green-50"
              },
              { 
                icon: Heart, 
                title: "Kenangan Abadi", 
                description: "Simpan semua foto dalam kualitas tinggi untuk kenangan yang tak terlupakan",
                emoji: "💝",
                gradient: "from-pink-500 to-rose-600",
                bgColor: "bg-pink-50"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={iconCardVariants}
                initial="hidden"
                animate="visible"
                custom={i}
                className="card-dynamic rounded-3xl p-6 sm:p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-dynamic group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-6 text-white text-3xl sm:text-4xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-12`}>
                  {item.emoji}
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-4 text-dynamic-primary group-hover:text-dynamic-accent transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-dynamic-secondary leading-relaxed text-base sm:text-lg font-medium">
                  {item.description}
                </p>
                
                {/* Mobile-friendly hover indicator */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-1 bg-gradient-to-r from-dynamic-accent to-dynamic-accent rounded-full mx-auto"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile-First Bottom CTA */}
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            className="mt-12 sm:mt-16 text-center"
          >
            <div className="bg-dynamic-accent/5 rounded-3xl p-6 sm:p-8 border border-dynamic-accent/20 max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-dynamic-primary mb-3">
                Siap Mengabadikan Momen Spesial Anda? 🎉
              </h3>
              <p className="text-dynamic-secondary mb-6 text-base sm:text-lg">
                Hubungi kami sekarang untuk konsultasi gratis dan dapatkan penawaran terbaik!
              </p>
              <Button 
                asChild
                size="lg"
                className="btn-dynamic-primary mobile-button text-base sm:text-lg py-4 sm:py-5 px-8 sm:px-10 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <a href="#contact" className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Mulai Sekarang
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}