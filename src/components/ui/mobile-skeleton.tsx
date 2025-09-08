'use client';

import { cn } from "@/lib/utils";

// Base mobile-first skeleton
function MobileSkeleton({
  className,
  shimmer = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gray-200/80 relative overflow-hidden",
        shimmer && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

// Mobile-optimized hero skeleton
function MobileHeroSkeleton() {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      {/* Logo skeleton */}
      <div className="absolute top-4 left-4 z-20">
        <MobileSkeleton className="h-8 w-32" />
      </div>
      
      {/* Bubble menu skeleton */}
      <div className="absolute top-4 right-4 z-20">
        <MobileSkeleton className="h-14 w-14 rounded-full" />
      </div>
      
      {/* Content skeleton */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 px-4 max-w-sm">
          <MobileSkeleton className="h-8 w-full mx-auto" />
          <MobileSkeleton className="h-6 w-3/4 mx-auto" />
          <div className="flex gap-3 justify-center mt-6">
            <MobileSkeleton className="h-12 w-28 rounded-full" />
            <MobileSkeleton className="h-12 w-24 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Bottom indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <MobileSkeleton key={i} className="w-3 h-3 rounded-full" />
        ))}
      </div>
    </div>
  );
}

// Mobile gallery skeleton
function MobileGallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="py-12 px-4">
      {/* Title skeleton */}
      <div className="text-center mb-8 space-y-3">
        <MobileSkeleton className="h-8 w-40 mx-auto" />
        <MobileSkeleton className="h-4 w-56 mx-auto" />
      </div>
      
      {/* Mobile grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-2">
            <MobileSkeleton className="aspect-square rounded-lg" />
            <MobileSkeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile events skeleton
function MobileEventsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="py-12 px-4">
      {/* Title skeleton */}
      <div className="text-center mb-8 space-y-3">
        <MobileSkeleton className="h-8 w-32 mx-auto" />
        <MobileSkeleton className="h-4 w-48 mx-auto" />
      </div>
      
      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Live', 'Upcoming', 'Completed'].map((tab, i) => (
          <MobileSkeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
      
      {/* Events cards - mobile scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex-shrink-0 w-72 space-y-3">
            <MobileSkeleton className="h-40 rounded-lg" />
            <div className="space-y-2">
              <MobileSkeleton className="h-5 w-3/4" />
              <MobileSkeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <MobileSkeleton className="h-6 w-16 rounded-full" />
                <MobileSkeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile pricing skeleton
function MobilePricingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="py-12 px-4">
      {/* Title skeleton */}
      <div className="text-center mb-8 space-y-3">
        <MobileSkeleton className="h-8 w-36 mx-auto" />
        <MobileSkeleton className="h-4 w-52 mx-auto" />
      </div>
      
      {/* Pricing cards - stacked on mobile */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="border rounded-xl p-6 space-y-4 bg-white">
            <div className="text-center space-y-2">
              <MobileSkeleton className="h-6 w-24 mx-auto" />
              <MobileSkeleton className="h-8 w-20 mx-auto" />
              <MobileSkeleton className="h-4 w-32 mx-auto" />
            </div>
            
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <MobileSkeleton className="h-4 w-4 rounded-full" />
                  <MobileSkeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            
            <MobileSkeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile contact skeleton
function MobileContactSkeleton() {
  return (
    <div className="py-12 px-4">
      {/* Title skeleton */}
      <div className="text-center mb-8 space-y-3">
        <MobileSkeleton className="h-8 w-28 mx-auto" />
        <MobileSkeleton className="h-4 w-44 mx-auto" />
      </div>
      
      {/* Contact form */}
      <div className="space-y-4 max-w-md mx-auto">
        <MobileSkeleton className="h-12 w-full rounded-lg" />
        <MobileSkeleton className="h-12 w-full rounded-lg" />
        <MobileSkeleton className="h-24 w-full rounded-lg" />
        <MobileSkeleton className="h-12 w-full rounded-lg" />
      </div>
      
      {/* Contact info */}
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <MobileSkeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <MobileSkeleton className="h-4 w-3/4" />
              <MobileSkeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Unified mobile page skeleton
function MobilePageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Scroll progress skeleton */}
      <MobileSkeleton className="fixed top-0 left-0 w-full h-1 z-50" />
      
      {/* Hero skeleton */}
      <MobileHeroSkeleton />
      
      {/* Events skeleton */}
      <MobileEventsSkeleton />
      
      {/* Gallery skeleton */}
      <MobileGallerySkeleton />
      
      {/* Pricing skeleton */}
      <MobilePricingSkeleton />
      
      {/* Contact skeleton */}
      <MobileContactSkeleton />
    </div>
  );
}

// Lightweight loading states for dynamic imports
function MobileSectionSkeleton({ 
  type, 
  height = "h-96" 
}: { 
  type: 'hero' | 'events' | 'gallery' | 'pricing' | 'contact';
  height?: string;
}) {
  const skeletonMap = {
    hero: MobileHeroSkeleton,
    events: MobileEventsSkeleton,
    gallery: MobileGallerySkeleton,
    pricing: MobilePricingSkeleton,
    contact: MobileContactSkeleton,
  };
  
  const SkeletonComponent = skeletonMap[type];
  
  if (type === 'hero') {
    return <SkeletonComponent />;
  }
  
  return (
    <div className={height}>
      <SkeletonComponent />
    </div>
  );
}

export {
  MobileSkeleton,
  MobileHeroSkeleton,
  MobileGallerySkeleton,
  MobileEventsSkeleton,
  MobilePricingSkeleton,
  MobileContactSkeleton,
  MobilePageSkeleton,
  MobileSectionSkeleton
};