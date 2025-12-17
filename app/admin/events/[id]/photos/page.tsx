/**
 * Photo Management Page
 * /admin/events/[id]/photos
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DraggablePhotoGrid from '@/components/admin/DraggablePhotoGrid';
import Link from 'next/link';
import { ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    sort?: string;
    filter?: string;
    search?: string;
  }>;
}

export default async function PhotoManagementPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { id: eventId } = await params;

  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    redirect('/admin/login');
  }

  const decoded = await verifyJWT(token.value);
  if (!decoded) {
    redirect('/admin/login');
  }

  // Fetch event with photos
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      clientId: true,
      _count: {
        select: {
          photos: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  if (!event) {
    redirect('/admin/events');
  }

  // Check permissions
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true, id: true },
  });

  if (!user) {
    redirect('/admin/login');
  }

  const isAdmin = user.role === 'ADMIN';
  const isOwner = event.clientId === decoded.userId;

  if (!isAdmin && !isOwner) {
    redirect('/admin/events');
  }

  // Build query based on filters
  let orderBy: any = { displayOrder: 'asc' }; // Default: order by display_order
  const sort = resolvedSearchParams.sort || 'order';

  switch (sort) {
    case 'order':
      orderBy = { displayOrder: 'asc' };
      break;
    case 'date-asc':
      orderBy = { createdAt: 'asc' };
      break;
    case 'date-desc':
      orderBy = { createdAt: 'desc' };
      break;
    case 'size-asc':
      orderBy = { fileSize: 'asc' };
      break;
    case 'size-desc':
      orderBy = { fileSize: 'desc' };
      break;
    case 'name-asc':
      orderBy = { filename: 'asc' };
      break;
    case 'name-desc':
      orderBy = { filename: 'desc' };
      break;
  }

  // Build where clause
  const where: any = {
    eventId: eventId,
    deletedAt: null,
  };

  // Apply date filter
  if (resolvedSearchParams.filter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  } else if (resolvedSearchParams.filter === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    where.createdAt = { gte: weekAgo };
  }

  // Apply search
  if (resolvedSearchParams.search) {
    where.filename = {
      contains: resolvedSearchParams.search,
      mode: 'insensitive',
    };
  }

  // Fetch photos with all required fields - ORDERED BY displayOrder
  const photos = await prisma.photo.findMany({
    where,
    orderBy,
    select: {
      id: true,
      filename: true,
      originalUrl: true,
      thumbnailSmallUrl: true,
      thumbnailMediumUrl: true,
      thumbnailLargeUrl: true,
      fileSize: true,
      width: true,
      height: true,
      mimeType: true,
      caption: true,
      isFeatured: true,
      likesCount: true,
      viewsCount: true,
      downloadCount: true,
      createdAt: true,
      displayOrder: true,
      event: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 100, // Limit for performance
  });

  const photoCount = event._count.photos;

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
          <span className="font-semibold text-gray-900">Photos</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photo Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Event: <span className="font-semibold">{event.name}</span> • {photoCount} photos
            </p>
          </div>
          <Link
            href={`/admin/events/${eventId}/photos/upload`}
            className="inline-flex items-center rounded-lg bg-[#54ACBF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#54ACBF]/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Link>
        </div>

        {/* Photo Grid with Drag & Drop */}
        {photos.length > 0 ? (
          <DraggablePhotoGrid
            photos={photos}
            eventId={eventId}
            currentSort={sort}
            currentFilter={resolvedSearchParams.filter}
            currentSearch={resolvedSearchParams.search}
          />
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No photos yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by uploading photos to this event.
            </p>
            <Link
              href={`/admin/events/${eventId}/photos/upload`}
              className="mt-6 inline-flex items-center rounded-lg bg-[#54ACBF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#54ACBF]/90"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
