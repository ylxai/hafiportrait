// Static imports for all components
import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSlideshow from "@/components/hero-slideshow";
import EventsSection from "@/components/events-section";
import GallerySection from "@/components/gallery-section";
import PricingSection from "@/components/modern-glassmorphism-pricing";
import SpotlightPricingSection from "@/components/spotlight-pricing-section";
import ContactSection from "@/components/contact-section";

// Optimized data fetching with proper error handling and caching
async function getHomepageData() {
  try {
    // Import database directly instead of HTTP fetch to avoid localhost issues
    const { database } = await import('@/lib/database');
    
    // Direct database calls are faster than HTTP requests
    const [slideshowPhotos, galleryPhotos] = await Promise.all([
      database.getHomepagePhotos(), // Use same function for slideshow
      database.getHomepagePhotos()
    ]);

    return {
      slideshowPhotos: slideshowPhotos.slice(0, 8) || [], // Limit slideshow to 8 photos
      galleryPhotos: galleryPhotos.slice(0, 12) || [] // Limit gallery to 12 photos
    };
  } catch (error) {
    console.error('Homepage data fetch error:', error);
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