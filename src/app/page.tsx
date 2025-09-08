'use client';

import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Static imports for simple components
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";
import { MobileFadeIn, MobileSlideUp } from "@/components/ui/mobile-scroll-container";

// Mobile-first optimized dynamic imports
import { MobileSectionSkeleton } from "@/components/ui/mobile-skeleton";

const HeroSlideshow = dynamic(() => import("@/components/hero-slideshow"), {
  ssr: false,
  loading: () => <MobileSectionSkeleton type="hero" />
});

const EventsSection = dynamic(() => import("@/components/events-section"), {
  loading: () => <MobileSectionSkeleton type="events" height="h-auto" />
});

const GallerySection = dynamic(() => import("@/components/gallery-section"), {
  loading: () => <MobileSectionSkeleton type="gallery" height="h-auto" />
});

const PricingSection = dynamic(() => import("@/components/pricing-section-glassmorphism"), {
  loading: () => <MobileSectionSkeleton type="pricing" height="h-auto" />
});

const ContactSection = dynamic(() => import("@/components/contact-section"), {
  loading: () => <MobileSectionSkeleton type="contact" height="h-auto" />
});

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white">
          <ScrollProgressBar />
          <Header />
          <main className="relative">
            <HeroSlideshow 
              className="h-screen"
              autoplay={true}
              interval={6000}
              showControls={true}
            />
            
            <MobileFadeIn delay={200} threshold={0.2}>
              <EventsSection />
            </MobileFadeIn>
            
            <MobileSlideUp delay={300} threshold={0.15}>
              <GallerySection />
            </MobileSlideUp>
            
            <MobileFadeIn delay={400} threshold={0.2}>
              <PricingSection />
            </MobileFadeIn>
            
            <MobileSlideUp delay={500} threshold={0.15}>
              <ContactSection />
            </MobileSlideUp>
          </main>
          <Footer />
        </div>
    </QueryClientProvider>
  );
}