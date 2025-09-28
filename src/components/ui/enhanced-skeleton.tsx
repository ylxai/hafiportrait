'use client';

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Base enhanced skeleton with shimmer effect
function EnhancedSkeleton({
  className,
  shimmer = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-gray-200 relative overflow-hidden",
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Event header skeleton
function EventHeaderSkeleton() {
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mobile-container">
        <div className={`flex items-center justify-between ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className="flex-1 min-w-0 space-y-2">
            <EnhancedSkeleton 
              className={`${isMobile ? 'h-6 w-48' : 'h-8 w-64'}`} 
            />
            <EnhancedSkeleton 
              className={`${isMobile ? 'h-3 w-32' : 'h-4 w-40'}`} 
            />
          </div>
          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
            <EnhancedSkeleton 
              className={`${isMobile ? 'h-8 w-8' : 'h-10 w-20'} rounded-md`} 
            />
            <EnhancedSkeleton 
              className={`${isMobile ? 'h-8 w-8' : 'h-10 w-16'} rounded-md`} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}

// Photo grid skeleton
function PhotoGridSkeleton({ count = 8 }: { count?: number }) {
  const isMobile = useIsMobile();
  
  return (
    <div className={`photo-grid ${
      isMobile 
        ? 'grid-cols-2 gap-3' 
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    }`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <EnhancedSkeleton 
            className={`w-full ${isMobile ? 'h-40' : 'h-48'} rounded-xl`}
          />
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <EnhancedSkeleton className="h-4 w-4 rounded-full" />
              <EnhancedSkeleton className="h-3 w-6" />
            </div>
            {!isMobile && (
              <EnhancedSkeleton className="h-3 w-16" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Message card skeleton
function MessageCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg bg-white space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton className="h-4 w-24" />
          <EnhancedSkeleton className="h-4 w-full" />
          <EnhancedSkeleton className="h-4 w-3/4" />
          <EnhancedSkeleton className="h-3 w-32" />
        </div>
        <EnhancedSkeleton className="h-8 w-12 rounded-md" />
      </div>
      
      {/* Reactions skeleton */}
      <div className="border-t pt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-6 w-12 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Guestbook skeleton
function GuestbookSkeleton() {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <EnhancedSkeleton className={`mx-auto ${isMobile ? 'h-6 w-40' : 'h-8 w-48'}`} />
        <EnhancedSkeleton className={`mx-auto ${isMobile ? 'h-4 w-56' : 'h-5 w-64'}`} />
      </div>

      {/* Form skeleton */}
      <div className={`border rounded-lg bg-white ${isMobile ? 'p-4' : 'p-6'} space-y-4`}>
        <EnhancedSkeleton className={`w-full ${isMobile ? 'h-10' : 'h-11'}`} />
        <EnhancedSkeleton className="w-full h-20" />
        <EnhancedSkeleton className={`w-full ${isMobile ? 'h-11' : 'h-12'}`} />
      </div>

      {/* Messages skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <MessageCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

// Upload form skeleton
function UploadFormSkeleton() {
  const isMobile = useIsMobile();
  
  return (
    <div className={`border rounded-lg bg-white ${isMobile ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="text-center space-y-2">
        <EnhancedSkeleton className="mx-auto h-12 w-12 rounded-full" />
        <EnhancedSkeleton className="mx-auto h-5 w-32" />
        <EnhancedSkeleton className="mx-auto h-4 w-48" />
      </div>
      
      <div className="space-y-3">
        <EnhancedSkeleton className="w-full h-32 rounded-lg border-2 border-dashed" />
        <div className="flex gap-2">
          <EnhancedSkeleton className="flex-1 h-10" />
          <EnhancedSkeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

// Tab content skeleton
function TabContentSkeleton({ type }: { type: 'photo' | 'guestbook' }) {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
      {/* Tab header skeleton */}
      <div className="text-center space-y-2">
        <EnhancedSkeleton className={`mx-auto ${isMobile ? 'h-6 w-32' : 'h-8 w-40'}`} />
        <EnhancedSkeleton className={`mx-auto ${isMobile ? 'h-4 w-48' : 'h-5 w-56'}`} />
      </div>

      {type === 'photo' ? (
        <>
          {/* Upload form skeleton for guest albums */}
          <UploadFormSkeleton />
          {/* Photo grid skeleton */}
          <PhotoGridSkeleton />
        </>
      ) : (
        <GuestbookSkeleton />
      )}
    </div>
  );
}

// Access code form skeleton
function AccessCodeSkeleton() {
  const isMobile = useIsMobile();
  
  return (
    <div className={`mb-6 mx-auto border rounded-lg bg-white ${isMobile ? 'p-4' : 'p-6 max-w-md'} space-y-4`}>
      <div className="flex items-center gap-2">
        <EnhancedSkeleton className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} rounded-md`} />
        <EnhancedSkeleton className={`${isMobile ? 'h-5 w-32' : 'h-6 w-40'}`} />
      </div>
      
      <EnhancedSkeleton className="h-4 w-full" />
      <EnhancedSkeleton className="h-4 w-3/4" />
      
      <div className={`flex ${isMobile ? 'gap-3' : 'gap-2'}`}>
        <EnhancedSkeleton className="flex-1 h-10" />
        <EnhancedSkeleton className={`${isMobile ? 'h-10 w-12' : 'h-10 w-16'}`} />
      </div>
    </div>
  );
}

// Full page skeleton
function EventPageSkeleton() {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-wedding-ivory">
      <EventHeaderSkeleton />
      
      <div className="mobile-container mobile-spacing">
        {/* Tabs skeleton */}
        <div className="w-full space-y-6">
          <div className={`${
            isMobile 
              ? 'grid grid-cols-4 h-auto p-1 gap-1' 
              : 'grid grid-cols-4 gap-2'
          } bg-gray-100 rounded-lg p-1`}>
            {['Official', 'Tamu', 'Bridesmaid', 'Guestbook'].map((tab) => (
              <EnhancedSkeleton 
                key={tab}
                className={`${isMobile ? 'h-10' : 'h-12'} rounded-md`}
              />
            ))}
          </div>
          
          {/* Tab content skeleton */}
          <TabContentSkeleton type="photo" />
        </div>
      </div>
    </div>
  );
}

export {
  EnhancedSkeleton,
  EventHeaderSkeleton,
  PhotoGridSkeleton,
  MessageCardSkeleton,
  GuestbookSkeleton,
  UploadFormSkeleton,
  TabContentSkeleton,
  AccessCodeSkeleton,
  EventPageSkeleton
};