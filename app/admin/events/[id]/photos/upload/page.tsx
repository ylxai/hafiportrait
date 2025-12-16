/**
 * Photo Upload Page
 * /admin/events/[id]/photos/upload
 */

import { redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PhotoUploader from '@/components/admin/PhotoUploader';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhotoUploadPage({ params }: PageProps) {
  const { id: eventId } = await params;

  // Verify authentication
  const user = await getUserFromRequest(null);
  if (!user || user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  // Fetch event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      clientId: true,
      client: {
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
  const isOwner = event.clientId === user.id;

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
          <Link href={`/admin/events/${eventId}`} className="hover:text-gray-900">
            {event.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-gray-900">Upload Photos</span>
        </nav>

        {/* Back Button */}
        <Link
          href={`/admin/events/${eventId}/photos`}
          className="mb-6 inline-flex items-center text-sm font-medium text-[#54ACBF] hover:text-[#54ACBF]/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Photo Management
        </Link>

        {/* Main Content */}
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <PhotoUploader
            eventId={eventId}
            eventName={event.name}
            onUploadComplete={() => {
              // Redirect to photo management page after upload
            }}
          />
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
