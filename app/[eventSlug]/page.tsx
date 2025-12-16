import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getGallerySession } from '@/lib/gallery/auth';
import GuestAccessForm from '@/components/gallery/GuestAccessForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    eventSlug: string;
  }>;
  searchParams: Promise<{
    code?: string;
  }>;
}

export default async function EventAccessPage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params;
  const { code } = await searchParams;

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
      photos: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          thumbnailMediumUrl: true,
          thumbnailUrl: true,
        },
        take: 1,
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  });

  if (!event) {
    notFound();
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

  // If QR code scan with access code, redirect to API for validation
  if (code) {
    redirect(`/api/gallery/${eventSlug}/access?code=${code}`);
  }

  // Check if user already has valid session
  const session = await getGallerySession(event.id);
  if (session) {
    redirect(`/${eventSlug}/gallery`);
  }

  // Get cover photo URL
  const coverPhotoUrl = event.photos[0]?.thumbnailMediumUrl || event.photos[0]?.thumbnailUrl || null;

  return (
    <GuestAccessForm
      eventSlug={eventSlug}
      eventName={event.name}
      eventDate={event.eventDate?.toISOString() || null}
      coverPhotoUrl={coverPhotoUrl}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { eventSlug } = await params;
  
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      name: true,
      description: true,
    },
  });

  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }

  return {
    title: `${event.name} - Gallery`,
    description: event.description || `View photos from ${event.name}`,
  };
}
