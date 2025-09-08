'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Heart, Users, Sparkles, Crown, Gift } from 'lucide-react';

interface PolaroidPhoto {
  id: number;
  title: string;
  eventType: string;
  icon: any;
  gradient: string;
  rotation: number;
  zIndex: number;
  emoji: string;
}

export default function InteractivePolaroidStack() {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
  const [isScattered, setIsScattered] = useState(false);
  const [hoveredPhoto, setHoveredPhoto] = useState<number | null>(null);

  const initialPhotos: PolaroidPhoto[] = [
    {
      id: 1,
      title: "Wedding Celebration",
      eventType: "Pernikahan Impian",
      icon: Heart,
      gradient: "from-pink-400 to-rose-600",
      rotation: -8,
      zIndex: 6,
      emoji: "💕"
    },
    {
      id: 2,
      title: "Corporate Event",
      eventType: "Acara Perusahaan",
      icon: Users,
      gradient: "from-blue-400 to-indigo-600",
      rotation: 5,
      zIndex: 5,
      emoji: "🏢"
    },
    {
      id: 3,
      title: "Birthday Party",
      eventType: "Ulang Tahun Spesial",
      icon: Gift,
      gradient: "from-yellow-400 to-orange-600",
      rotation: -3,
      zIndex: 4,
      emoji: "🎂"
    },
    {
      id: 4,
      title: "Family Gathering",
      eventType: "Momen Keluarga",
      icon: Users,
      gradient: "from-green-400 to-emerald-600",
      rotation: 7,
      zIndex: 3,
      emoji: "👨‍👩‍👧‍👦"
    },
    {
      id: 5,
      title: "Graduation",
      eventType: "Wisuda Bersejarah",
      icon: Crown,
      gradient: "from-purple-400 to-violet-600",
      rotation: -5,
      zIndex: 2,
      emoji: "🎓"
    },
    {
      id: 6,
      title: "Engagement",
      eventType: "Lamaran Romantis",
      icon: Sparkles,
      gradient: "from-rose-400 to-pink-600",
      rotation: 2,
      zIndex: 1,
      emoji: "💍"
    }
  ];

  useEffect(() => {
    setPhotos(initialPhotos);
  }, []);

  const handleStackClick = () => {
    setIsScattered(!isScattered);
  };

  const getScatteredPosition = (index: number) => {
    // Mobile-first scattered positions (smaller distances)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    const mobilePositions = [
      { x: 0, y: 0, rotation: -8 },      // Center
      { x: 60, y: -30, rotation: 15 },   // Top right (closer)
      { x: -60, y: -20, rotation: -12 }, // Top left (closer)
      { x: 50, y: 40, rotation: 8 },     // Bottom right (closer)
      { x: -50, y: 30, rotation: -15 },  // Bottom left (closer)
      { x: 0, y: -50, rotation: 5 }      // Top center (closer)
    ];
    
    const desktopPositions = [
      { x: 0, y: 0, rotation: -8 },      // Center
      { x: 120, y: -40, rotation: 15 },   // Top right
      { x: -100, y: -20, rotation: -12 }, // Top left
      { x: 80, y: 60, rotation: 8 },      // Bottom right
      { x: -80, y: 40, rotation: -15 },   // Bottom left
      { x: 0, y: -80, rotation: 5 }       // Top center
    ];
    
    const positions = isMobile ? mobilePositions : desktopPositions;
    return positions[index] || { x: 0, y: 0, rotation: 0 };
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8 px-4">
      {/* Title - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-4 sm:mb-6 max-w-sm sm:max-w-none mx-auto"
      >
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-dynamic-primary mb-2">
          📸 Berbagai Jenis Event
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-dynamic-secondary px-2">
          {isScattered ? "Klik foto untuk detail • Klik area kosong untuk kumpulkan" : "Klik untuk melihat semua jenis event"}
        </p>
      </motion.div>

      {/* Polaroid Stack - Mobile Centered */}
      <div className="flex justify-center w-full">
        <div 
          className="relative w-64 h-48 sm:w-80 sm:h-64 md:w-96 md:h-80 cursor-pointer mx-auto"
          onClick={!isScattered ? handleStackClick : undefined}
        >
        <AnimatePresence>
          {photos.map((photo, index) => {
            const scatteredPos = getScatteredPosition(index);
            const IconComponent = photo.icon;
            
            return (
              <motion.div
                key={photo.id}
                className="absolute w-40 h-48 sm:w-48 sm:h-56 md:w-56 md:h-64 bg-white rounded-lg shadow-xl cursor-pointer"
                style={{
                  zIndex: hoveredPhoto === photo.id ? 100 : photo.zIndex,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: photo.rotation,
                }}
                animate={{
                  x: isScattered ? scatteredPos.x : 0,
                  y: isScattered ? scatteredPos.y : index * -1,
                  rotate: isScattered ? scatteredPos.rotation : photo.rotation,
                  scale: hoveredPhoto === photo.id ? 1.1 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  duration: 0.6,
                  delay: isScattered ? index * 0.1 : 0
                }}
                whileHover={{
                  scale: 1.05,
                  rotate: isScattered ? scatteredPos.rotation + 5 : photo.rotation + 3,
                  transition: { duration: 0.2 }
                }}
                onHoverStart={() => setHoveredPhoto(photo.id)}
                onHoverEnd={() => setHoveredPhoto(null)}
                onClick={(e) => {
                  if (isScattered) {
                    e.stopPropagation();
                    // Handle individual photo click
                  }
                }}
              >
                {/* Polaroid Frame */}
                <div className="w-full h-full p-4 flex flex-col">
                  {/* Photo Area */}
                  <div className={`flex-1 rounded bg-gradient-to-br ${photo.gradient} flex items-center justify-center relative overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-white/20 rounded-full"
                          style={{
                            top: `${20 + i * 15}%`,
                            left: `${10 + (i % 2) * 70}%`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Main Icon */}
                    <div className="relative z-10 text-center">
                      <div className="text-4xl sm:text-5xl mb-2">{photo.emoji}</div>
                      <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white mx-auto" />
                    </div>

                    {/* Hover Overlay */}
                    {hoveredPhoto === photo.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/20 flex items-center justify-center"
                      >
                        <div className="text-white text-center">
                          <Camera className="w-6 h-6 mx-auto mb-1" />
                          <div className="text-xs font-medium">Click to explore</div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Polaroid Caption */}
                  <div className="mt-3 text-center">
                    <div className="text-sm font-bold text-gray-800">{photo.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{photo.eventType}</div>
                  </div>
                </div>

                {/* Tape Effect */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200/80 rounded-sm shadow-sm border border-yellow-300/50"></div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Reset Button when scattered */}
        {isScattered && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            onClick={handleStackClick}
            className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2 bg-dynamic-accent text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-dynamic-accent/90 transition-colors shadow-lg z-50"
          >
            📚 Kumpulkan Kembali
          </motion.button>
        )}
        </div>
      </div>

      {/* Bottom Info - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 sm:mt-8 text-center px-4"
      >
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-dynamic-secondary">
          <span className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
            <Heart className="w-3 h-3 text-red-500" />
            <span className="hidden sm:inline">Professional Quality</span>
            <span className="sm:hidden">Quality</span>
          </span>
          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
            <Camera className="w-3 h-3 text-blue-500" />
            <span className="hidden sm:inline">Real-time Upload</span>
            <span className="sm:hidden">Real-time</span>
          </span>
          <span className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span className="hidden sm:inline">Watermark Included</span>
            <span className="sm:hidden">Watermark</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}