'use client';

import { cn } from "@/lib/utils";

// Skeleton yang dioptimasi untuk performa - tanpa delay
function MobileSkeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "pulse";
}) {
  const variants = {
    default: "animate-pulse bg-gray-200/80",
    pulse: "animate-pulse bg-gray-200/80"
  };

  return (
    <div
      className={cn(
        "rounded-lg relative overflow-hidden",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Hero skeleton yang dioptimasi - tampil langsung tanpa delay
function MobileHeroSkeleton() {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      {/* Logo skeleton */}
      <div className="absolute top-4 left-4 z-20">
        <MobileSkeleton 
          className="h-8 w-32 rounded-md" 
          variant="pulse"
        />
      </div>
      
      {/* Bubble menu skeleton */}
      <div className="absolute top-4 right-4 z-20">
        <MobileSkeleton 
          className="h-14 w-14 rounded-full" 
          variant="pulse"
        />
      </div>
      
      {/* Content skeleton - tampil langsung */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 px-4 max-w-sm">
          {/* Main title skeleton */}
          <MobileSkeleton 
            className="h-10 w-full rounded-lg mx-auto" 
            variant="pulse"
          />
          {/* Subtitle skeleton */}
          <MobileSkeleton 
            className="h-6 w-3/4 mx-auto rounded-md" 
            variant="pulse"
          />
          {/* Buttons skeleton */}
          <div className="flex gap-3 justify-center mt-6">
            <MobileSkeleton 
              className="h-12 w-28 rounded-full" 
              variant="pulse"
            />
            <MobileSkeleton 
              className="h-12 w-24 rounded-full" 
              variant="pulse"
            />
          </div>
        </div>
      </div>
      
      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <MobileSkeleton 
            key={i} 
            className="w-3 h-3 rounded-full" 
            variant="pulse"
          />
        ))}
      </div>
      
      {/* Swipe indicator skeleton */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <MobileSkeleton 
          className="h-6 w-48 rounded-full" 
          variant="pulse"
        />
      </div>
    </div>
  );
}

// Gallery skeleton yang dioptimasi - tampil langsung
function MobileGallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="py-12 px-4">
      {/* Title skeleton */}
      <div className="text-center mb-8 space-y-3">
        <MobileSkeleton 
          className="h-8 w-40 mx-auto rounded-lg" 
          variant="pulse"
        />
        <MobileSkeleton 
          className="h-4 w-56 mx-auto rounded-md" 
          variant="pulse"
        />
      </div>
      
      {/* Mobile grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
              <MobileSkeleton 
                className="aspect-square" 
                variant="pulse"
              />
            </div>
            <MobileSkeleton 
              className="h-3 w-3/4 rounded-sm" 
              variant="pulse"
            />
          </div>
        ))}
      </div>
      
      {/* Load more indicator */}
      <div className="text-center mt-6">
        <MobileSkeleton 
          className="h-10 w-32 mx-auto rounded-lg" 
          variant="pulse"
        />
      </div>
    </div>
  );
}

// Events skeleton yang dioptimasi - tampil langsung
function MobileEventsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="pt-8 pb-16 px-4">
      {/* Title skeleton */}
      <div className="text-center mb-8 space-y-3">
        <MobileSkeleton 
          className="h-8 w-40 mx-auto rounded-lg" 
          variant="pulse"
        />
        <MobileSkeleton 
          className="h-4 w-56 mx-auto rounded-md" 
          variant="pulse"
        />
      </div>
      
      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Live', 'Upcoming', 'Completed'].map((tab, i) => (
          <MobileSkeleton 
            key={i} 
            className="h-10 w-20 rounded-xl flex-shrink-0" 
            variant="pulse"
          />
        ))}
        <MobileSkeleton 
          className="h-10 w-10 rounded-xl flex-shrink-0" 
          variant="pulse"
        />
      </div>
      
      {/* Events cards - mobile scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex-shrink-0 w-80 space-y-3">
            {/* Card header with status badge */}
            <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <MobileSkeleton 
                  className="h-6 w-3/4 rounded-md" 
                  variant="pulse"
                />
                <MobileSkeleton 
                  className="h-6 w-16 rounded-full" 
                  variant="pulse"
                />
              </div>
              
              {/* Event details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MobileSkeleton 
                    className="h-4 w-4 rounded-sm" 
                    variant="pulse"
                  />
                  <MobileSkeleton 
                    className="h-4 w-32 rounded-sm" 
                    variant="pulse"
                  />
                </div>
                
                {/* Badges */}
                <div className="flex gap-2">
                  <MobileSkeleton 
                    className="h-6 w-20 rounded-full" 
                    variant="pulse"
                  />
                  <MobileSkeleton 
                    className="h-6 w-16 rounded-full" 
                    variant="pulse"
                  />
                </div>
                
                {/* Action button */}
                <MobileSkeleton 
                  className="h-10 w-full rounded-lg" 
                  variant="pulse"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Scroll indicator */}
      <div className="text-center mt-4">
        <MobileSkeleton 
          className="h-5 w-48 mx-auto rounded-full" 
          variant="pulse"
        />
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