// Static imports for all components
import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSlideshow from "@/components/hero-slideshow";
import ClientEventsSection from "@/components/client-events-section";
import GallerySection from "@/components/gallery-section";
import PricingSection from "@/components/modern-glassmorphism-pricing";
import ClientPricingSection from "@/components/client-pricing-section";
import ContactSection from "@/components/contact-section";

// Optimized data fetching for SSR with proper error handling
async function getHomepageData() {
  try {
    // Dynamic base URL selection for runtime
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://127.0.0.1:3000'  // Use localhost IP for internal SSR calls
      : 'http://localhost:3002';
    
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
  // Force client-side rendering for better domain compatibility
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
        <ClientEventsSection />
        <GallerySection photos={galleryPhotos} />
        <ClientPricingSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}