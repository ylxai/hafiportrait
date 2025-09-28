// Static imports for all components
import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSlideshow from "@/components/hero-slideshow";
import EventsSection from "@/components/events-section";
import GallerySection from "@/components/gallery-section";
import PricingSection from "@/components/modern-glassmorphism-pricing";
import SpotlightPricingSection from "@/components/spotlight-pricing-section";
import ContactSection from "@/components/contact-section";

// Optimized data fetching for SSR with proper error handling
async function getHomepageData() {
  try {
    // Dynamic port selection for runtime
    const port = process.env.NODE_ENV === 'production' ? '3000' : '3002';
    const baseUrl = `http://localhost:${port}`;
    
    const response = await fetch(`${baseUrl}/api/photos/homepage`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const photos = await response.json();

    return {
      slideshowPhotos: photos.slice(0, 8) || [], // Limit slideshow to 8 photos
      galleryPhotos: photos.slice(0, 12) || [] // Limit gallery to 12 photos
    };
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    // Fallback to empty arrays to prevent SSR crash
    return { slideshowPhotos: [], galleryPhotos: [] };
  }
}

export default async function HomePage() {
  const { slideshowPhotos, galleryPhotos } = await getHomepageData();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="relative">
        <HeroSlideshow
          photos={slideshowPhotos}
          className="h-screen"
          autoplay={true}
          interval={6000}
          showControls={true}
        />
        <EventsSection />
        <GallerySection photos={galleryPhotos} />
        <SpotlightPricingSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}