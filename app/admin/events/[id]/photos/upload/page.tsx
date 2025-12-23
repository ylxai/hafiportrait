/**
 * Photo Upload Page
 * /admin/events/[id]/photos/upload
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PhotoUploader from '@/components/admin/PhotoUploader';
import Link from 'next/link';
import { 
  ChevronRightIcon as ChevronRight, 
  ArrowLeftIcon as ArrowLeft 
} from '@heroicons/react/24/outline';
import { UploadErrorBoundary } from '@/components/error-boundaries';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhotoUploadPage({ params }: PageProps) {
  const { id: event_id } = await params;

  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    redirect('/admin/login');
  }

  const user = await verifyJWT(token.value);

  if (!user || user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  // Fetch event
  const event = await prisma.events.findUnique({
    where: { id: event_id },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      client_id: true,
      users: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!event) {
    redirect('/admin/events');
  }

  // Check permissions
  const isAdmin = user.role === 'ADMIN';
  const isOwner = event.client_id === user.id;

  if (!isAdmin && !isOwner) {
    redirect('/admin/events');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/admin/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/admin/events" className="hover:text-gray-900">
            Events
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/events/${event_id}`} className="hover:text-gray-900">
            {event.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-gray-900">Upload Photos</span>
        </nav>

        {/* Back Button */}
        <Link
          href={`/admin/events/${event_id}/photos`}
          className="mb-6 inline-flex items-center text-sm font-medium text-[#54ACBF] hover:text-[#54ACBF]/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Photo Management
        </Link>

        {/* Main Content */}
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <UploadErrorBoundary errorContext="Photo Upload" eventId={event_id}>
            <PhotoUploader
              event_id={event_id}
              eventName={event.name}
              onUploadComplete={() => {
                // Redirect to photo management page after upload
                // This is handled by the client component or we can add a router.push here if we made this a client component, 
                // but this is a server component rendering a client component.
                // The PhotoUploader should handle redirection or UI feedback.
              }}
            />
          </UploadErrorBoundary>
        </div>

        {/* Help Text */}
        <div className="mt-6 rounded-lg bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900">Tips for uploading:</h3>
          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            <li>• Upload photos dalam format JPG, PNG, atau WebP</li>
            <li>• Maximum ukuran file: 50MB per photo</li>
            <li>• Photos akan otomatis dikompresi dan thumbnail akan digenerate</li>
            <li>• Upload maksimal 500 photos per batch untuk performa optimal</li>
            <li>• Jika ada yang gagal, gunakan tombol "Retry Failed" untuk upload ulang</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
