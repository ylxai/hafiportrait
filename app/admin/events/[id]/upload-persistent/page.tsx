import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import PhotoUploaderPersistent from '@/components/admin/PhotoUploaderPersistent';
import { UploadErrorBoundary } from '@/components/error-boundaries';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UploadPersistentPage({ params }: PageProps) {
  const { id } = await params;

  const event = await prisma.events.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      location: true,
    },
  });

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <UploadErrorBoundary errorContext="Persistent Upload" eventId={event.id}>
          <PhotoUploaderPersistent
            event_id={event.id}
            eventName={event.name}
            onUploadComplete={(results) => {
              // Refresh page atau update UI setelah upload
              console.log('Upload completed:', results);
              // Optional: redirect atau refresh
              // window.location.reload();
            }}
          />
        </UploadErrorBoundary>
      </div>
    </div>
  );
}
