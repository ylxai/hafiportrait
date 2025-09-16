// Static imports for all components
import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSlideshow from "@/components/hero-slideshow";
import EventsSection from "@/components/events-section";
import GallerySection from "@/components/gallery-section";
import PricingSection from "@/components/modern-glassmorphism-pricing";
import SpotlightPricingSection from "@/components/spotlight-pricing-section";
import ContactSection from "@/components/contact-section";

// Centralized data fetching function for server component
async function getHomepageData() {
  // Use absolute URL for server-side fetch, conditionally checking for development environment
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3002' 
    : (process.env.NEXTAUTH_URL_INTERNAL || 'http://localhost:3000');


  const slideshowPromise = fetch(`${baseUrl}/api/slideshow`, { cache: 'no-store' });
  const galleryPromise = fetch(`${baseUrl}/api/photos/homepage`, { cache: 'no-store' });

  try {
    const [slideshowRes, galleryRes] = await Promise.all([slideshowPromise, galleryPromise]);


    if (!slideshowRes.ok || !galleryRes.ok) {
      return { slideshowPhotos: [], galleryPhotos: [] };
    }

    const slideshowPhotos = await slideshowRes.json();
    const galleryPhotos = await galleryRes.json();


    const finalData = {
      slideshowPhotos: Array.isArray(slideshowPhotos) ? slideshowPhotos : slideshowPhotos.photos || [],
      galleryPhotos: Array.isArray(galleryPhotos) ? galleryPhotos : galleryPhotos.photos || []
    };
    

    return finalData;
  } catch (error) {
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