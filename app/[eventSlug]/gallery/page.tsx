import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getGallerySession } from '@/lib/gallery/auth';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import GalleryHeader from '@/components/gallery/GalleryHeader';

interface PageProps {
  params: Promise<{
    eventSlug: string;
  }>;
}

export default async function GalleryPage({ params }: PageProps) {
  const { eventSlug } = await params;

  // Find event
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      eventDate: true,
      location: true,
      description: true,
      coverPhotoId: true,
    },
  });

  if (!event) {
    notFound();
  }

  // Check gallery access
  const session = await getGallerySession(event.id);
  if (!session) {
    redirect(`/${eventSlug}`);
  }

  // Check if event is archived
  if (event.status === 'ARCHIVED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Event Telah Diarsipkan
          </h1>
          <p className="text-gray-600">
            Event ini telah diarsipkan dan tidak lagi dapat diakses.
          </p>
        </div>
      </div>
    );
  }

  // Get photo count
  const photoCount = await prisma.photo.count({
    where: {
      eventId: event.id,
      deletedAt: null,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <GalleryHeader
        eventName={event.name}
        eventDate={event.eventDate}
        location={event.location}
        photoCount={photoCount}
      />
      
      <main className="container mx-auto px-4 py-6">
        <PhotoGrid eventId={event.id} eventSlug={event.slug} />
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { eventSlug } = await params;
  
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      name: true,
      description: true,
      eventDate: true,
    },
  });

  if (!event) {
    return {
      title: 'Gallery Not Found',
    };
  }

  return {
    title: `${event.name} - Photo Gallery`,
    description: event.description || `View photos from ${event.name}`,
  };
}
