'use client';

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Camera, MapPin, Clock, ArrowRight, Play, CheckCircle, Clock3, RefreshCw, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "@/components/ui/loading-spinner";
import OptimizedLoader from "@/components/reactbits/loading/OptimizedLoader";
import UniversalSkeleton from "@/components/reactbits/skeleton/UniversalSkeleton";
import type { Event } from "@/lib/database";
import { useSectionScrollAnimations } from "@/hooks/use-scroll-animations";
import { useMobileErrorHandler } from "@/hooks/use-mobile-error-handler";
import { MobileInlineError, MobileEmptyError, MobileNetworkStatus } from "@/components/error/mobile-inline-error";
// import { motion, Easing } from "framer-motion"; // Komentar/hapus impor ini untuk menguji

// easeOutCubicBezier: Easing = [0, 0, 0.58, 1]; // Komentari atau hapus definisi ini

// containerVariants: { // Komentari atau hapus definisi ini
//   hidden: { opacity: 0 },
//   visible: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.1,
//       delayChildren: 0.2
//     }
//   }
// };

// itemVariants: { // Komentari atau hapus definisi ini
//   hidden: { opacity: 0, y: 50, rotateX: -10 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     rotateX: 0,
//     transition: {
//       duration: 0.6,
//       ease: easeOutCubicBezier
//     }
//   }
// };

// Function to determine event status
function getEventStatus(eventDate: string): 'live' | 'upcoming' | 'completed' {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const eventEndTime = new Date(eventDateTime.getTime() + (12 * 60 * 60 * 1000)); // Assume 12 hours duration
  
  if (now >= eventDateTime && now <= eventEndTime) {
    return 'live';
  } else if (now < eventDateTime) {
    return 'upcoming';
  } else {
    return 'completed';
  }
}

// Function to get status badge styling
function getStatusBadge(status: 'live' | 'upcoming' | 'completed') {
  switch (status) {
    case 'live':
      return {
        icon: <Play className="w-3 h-3 mr-1" />,
        text: 'Live',
        className: 'bg-red-500 text-white animate-pulse'
      };
    case 'upcoming':
      return {
        icon: <Clock3 className="w-3 h-3 mr-1" />,
        text: 'Upcoming',
        className: 'bg-blue-500 text-white'
      };
    case 'completed':
      return {
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        text: 'Completed',
        className: 'bg-green-500 text-white'
      };
  }
}

export default function EventsSection() {
  // Filter state for mobile navigation
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mobile error handler
  const errorHandler = useMobileErrorHandler({
    maxRetries: 3,
    retryDelay: 1500,
    exponentialBackoff: true,
    showToasts: true,
    autoRetry: true,
    offlineMessage: "Data event akan dimuat saat koneksi kembali.",
    retryMessage: "Mengambil data event..."
  });
  
  // Enhanced useQuery dengan mobile error handling
  const { data: events, isLoading, isError, error, refetch } = useQuery<Event[]>({
    queryKey: ['events', 'homepage'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/events?homepage=true');
        
        if (!response.ok) {
          const errorBody = await response.text();
          const errorMessage = `HTTP ${response.status}: ${errorBody || 'Server error'}`;
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.warn('API response is not an array:', data);
          return [];
        }
        
        // Reset error state on success
        errorHandler.resetError();
        console.log("EventsSection: Data berhasil dimuat:", data.length, "events (homepage optimized)");
        return data;
      } catch (e) {
        console.error("EventsSection: Error mengambil data:", e);
        
        // Handle error with mobile error handler
        await errorHandler.handleError(e, refetch, 'Memuat Events');
        throw e;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes cache untuk homepage optimization
    retry: false, // Disable react-query retry, use our custom handler
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Auto refetch when network reconnects
  });

  // Filter events based on active filter
  const filteredEvents = events?.filter(event => {
    if (activeFilter === 'all') return true;
    const status = getEventStatus(event.date);
    return status === activeFilter;
  }) || [];

  // Consolidated scroll animations - optimized untuk mobile dan performance
  const { section, title, stagger, deviceInfo } = useSectionScrollAnimations({
    sectionThreshold: 0.1,
    titleThreshold: 0.3,
    itemCount: filteredEvents.length || 6,
    staggerDelay: 150,
    enableGPUOptimization: true,
    respectReducedMotion: true
  });

  // Destructure untuk backward compatibility
  const { elementRef: sectionRef, isVisible } = section;
  const { elementRef: titleRef, isVisible: titleVisible } = title;
  const { containerRef: eventsRef, visibleItems } = stagger;

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 300); // Optimized loading time
    }
  }, [refetch]);

  // Get filter counts
  const getFilterCounts = () => {
    if (!events || !Array.isArray(events)) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    
    return {
      all: events.length,
      live: events.filter(e => getEventStatus(e.date) === 'live').length,
      upcoming: events.filter(e => getEventStatus(e.date) === 'upcoming').length,
      completed: events.filter(e => getEventStatus(e.date) === 'completed').length,
    };
  };

  const filterCounts = getFilterCounts();

  
  return (
    <section 
      ref={sectionRef}
      id="events" 
      className="pt-0 md:pt-4 pb-8 md:pb-12 bg-gray-50"
    >
      {/* Mobile Network Status Indicator */}
      <MobileNetworkStatus />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">

        {/* Mobile-First Filter Tabs */}
        <div className="mb-1 md:mb-3">
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)} className="w-full">
            <div className="relative">
              {/* Pull to Refresh Indicator */}
              {isRefreshing && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                </div>
              )}
              
              {/* Sticky Filter Tabs */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 py-3 -mx-4 px-4">
                <div className="flex items-center justify-between mb-2">
                  <TabsList className="grid grid-cols-4 h-10 md:h-12 bg-gray-100 rounded-xl p-1 flex-1 mr-3">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-amber-600 transition-all duration-200"
                  >
                    <span className="flex items-center gap-1">
                      <Filter className="w-3 h-3 md:w-4 md:h-4" />
                      All
                      {filterCounts.all > 0 && (
                        <span className="bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                          {filterCounts.all}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="live" 
                    className="text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-red-500 transition-all duration-200"
                  >
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3 md:w-4 md:h-4" />
                      Live
                      {filterCounts.live > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center animate-pulse">
                          {filterCounts.live}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upcoming" 
                    className="text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-500 transition-all duration-200"
                  >
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-3 h-3 md:w-4 md:h-4" />
                      Soon
                      {filterCounts.upcoming > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                          {filterCounts.upcoming}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-500 transition-all duration-200"
                  >
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                      Done
                      {filterCounts.completed > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                          {filterCounts.completed}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                  </TabsList>
                  
                  {/* Refresh Button - Repositioned */}
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-12 w-10 md:w-12 p-0 rounded-xl border-gray-300 hover:border-purple-600 hover:bg-gray-50 flex-shrink-0"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
        
        {isLoading && (
          <div className="py-8">
            <UniversalSkeleton type="events" className="w-full" animated={true} />
          </div>
        )}

        {/* Enhanced Mobile Error Handling */}
        {isError && !isLoading && (
          <MobileInlineError
            error={error}
            isRetrying={errorHandler.isRetrying || isRefreshing}
            canRetry={errorHandler.canRetry}
            onRetry={async () => {
              setIsRefreshing(true);
              try {
                await errorHandler.manualRetry(refetch);
              } finally {
                setTimeout(() => setIsRefreshing(false), 500);
              }
            }}
            variant="card"
            size="md"
            showDetails={process.env.NODE_ENV === 'development'}
            className="mx-4 mb-6"
          />
        )}

        {/* Enhanced Empty State */}
        {!isLoading && !isError && events && events.length === 0 && (
          <MobileEmptyError
            title="Belum Ada Event"
            description="Event terbaru akan muncul di sini. Periksa kembali nanti atau hubungi admin."
            icon={Calendar}
            onRetry={async () => {
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                setTimeout(() => setIsRefreshing(false), 500);
              }
            }}
            className="mx-4"
          />
        )}

        {/* Cek apakah events itu ada dan memiliki panjang > 0 */}
        {!isLoading && !isError && events && events.length > 0 && ( // HANYA tampilkan jika array TIDAK kosong
          <>
            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
                {events
                  .sort((a, b) => {
                    // Sort by status: live > upcoming > completed
                    const statusOrder = { live: 0, upcoming: 1, completed: 2 };
                    const statusA = getEventStatus(a.date);
                    const statusB = getEventStatus(b.date);
                    return statusOrder[statusA] - statusOrder[statusB];
                  })
                  .map((event, index) => {
                    const eventStatus = getEventStatus(event.date);
                    const statusBadge = getStatusBadge(eventStatus);
                    
                    return (
                      <div key={event.id} className="flex-none w-80 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <Card className="border-amber-200 shadow-md hover:shadow-lg transition-all duration-300 h-full hover:animate-pulse-glow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg font-semibold text-gray-900 pr-2 leading-tight">
                                {event.name}
                              </CardTitle>
                              <Badge className={`${statusBadge.className} flex items-center text-xs font-medium shrink-0`}>
                                {statusBadge.icon}
                                {statusBadge.text}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                              <span className="truncate">
                                {new Date(event.date).toLocaleDateString('id-ID', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {event.is_premium && (
                                <Badge className="bg-amber-500 text-white text-xs">
                                  <Camera className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <Button 
                              asChild 
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white h-10 text-sm font-medium"
                            >
                              <a href={`/event/${event.id}`} target="_blank" rel="noopener noreferrer">
                                Lihat Event 
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {events
                .sort((a, b) => {
                  // Sort by status: live > upcoming > completed
                  const statusOrder = { live: 0, upcoming: 1, completed: 2 };
                  const statusA = getEventStatus(a.date);
                  const statusB = getEventStatus(b.date);
                  return statusOrder[statusA] - statusOrder[statusB];
                })
                .map((event, index) => {
                  const eventStatus = getEventStatus(event.date);
                  const statusBadge = getStatusBadge(eventStatus);
              
              return (
                <div key={event.id} className="group animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                  <Card className="border-amber-200 shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] overflow-hidden hover:animate-pulse-glow">
                    <CardHeader className="relative pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg md:text-xl font-semibold text-gray-900 pr-2 leading-tight">
                          {event.name}
                        </CardTitle>
                        {/* Status Badge */}
                        <Badge className={`${statusBadge.className} flex items-center text-xs font-medium shrink-0`}>
                          {statusBadge.icon}
                          {statusBadge.text}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {/* Event Date */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                        <span className="truncate">
                          {new Date(event.date).toLocaleDateString('id-ID', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* Premium Badge */}
                      <div className="flex items-center gap-2">
                        {event.is_premium && (
                          <Badge className="bg-amber-500 text-white text-xs">
                            <Camera className="w-3 h-3 mr-1" />
                            Premium Event
                          </Badge>
                        )}
                        {/* Photo Count Indicator */}
                        <div className="flex items-center text-xs text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          <span>Event Aktif</span>
                        </div>
                      </div>

                      {/* Mobile-Optimized Button */}
                      <Button 
                        asChild 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-4 h-10 md:h-11 text-sm md:text-base font-medium"
                      >
                        <a href={`/event/${event.id}`} target="_blank" rel="noopener noreferrer">
                          <span className="flex items-center justify-center">
                            Lihat Event 
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
            </div>
          </>
        )}
        
        {/* Mobile Scroll Indicator */}
        {!isLoading && !isError && filteredEvents.length > 2 && (
          <div className="md:hidden text-center mt-4">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              <ArrowRight className="w-3 h-3 mr-1 animate-pulse" />
              Geser untuk melihat event lainnya
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
