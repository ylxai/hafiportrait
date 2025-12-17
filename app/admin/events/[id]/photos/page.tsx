/**
 * Photo Management Page
 * /admin/events/[id]/photos
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DraggablePhotoGrid from '@/components/admin/DraggablePhotoGrid';
import { AdminErrorBoundary } from '@/components/error-boundaries';
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
  const { id: event_id } = await params;

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
    where: { id: event_id },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      client_id: true,
      _count: {
        select: {
          photos: {
            where: {
              deleted_at: null,
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
  const user = await prisma.users.findUnique({
    where: { id: decoded.user_id },
    select: { role: true, id: true },
  });

  if (!user) {
    redirect('/admin/login');
  }

  const isAdmin = user.role === 'ADMIN';
  const isOwner = event.client_id === decoded.user_id;

  if (!isAdmin && !isOwner) {
    redirect('/admin/events');
  }

  // Build query based on filters
  let orderBy: any = { display_order: 'asc' }; // Default: order by display_order
  const sort = resolvedSearchParams.sort || 'order';

  switch (sort) {
    case 'order':
      orderBy = { display_order: 'asc' };
      break;
    case 'date-asc':
      orderBy = { created_at: 'asc' };
      break;
    case 'date-desc':
      orderBy = { created_at: 'desc' };
      break;
    case 'size-asc':
      orderBy = { file_size: 'asc' };
      break;
    case 'size-desc':
      orderBy = { file_size: 'desc' };
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
    event_id: event_id,
    deleted_at: null,
  };

  // Apply date filter
  if (resolvedSearchParams.filter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.created_at = { gte: today };
  } else if (resolvedSearchParams.filter === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    where.created_at = { gte: weekAgo };
  }

  // Apply search
  if (resolvedSearchParams.search) {
    where.filename = {
      contains: resolvedSearchParams.search,
      mode: 'insensitive',
    };
  }

  // Fetch photos with all required fields - ORDERED BY display_order
  const photos = await prisma.photos.findMany({
    where,
    orderBy,
    select: {
      id: true,
      filename: true,
      original_url: true,
      thumbnail_small_url: true,
      thumbnail_medium_url: true,
      thumbnail_large_url: true,
      file_size: true,
      width: true,
      height: true,
      mime_type: true,
      caption: true,
      is_featured: true,
      likes_count: true,
      views_count: true,
      download_count: true,
      created_at: true,
      display_order: true,
      events: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 100, // Limit for performance
  });

  const photoCount = event._count.photos;

  // Map to frontend interface (camelCase)
  const formattedPhotos = photos.map(photo => ({
    id: photo.id,
    filename: photo.filename,
    original_url: photo.original_url,
    thumbnail_small_url: photo.thumbnail_small_url,
    thumbnail_medium_url: photo.thumbnail_medium_url,
    thumbnail_large_url: photo.thumbnail_large_url,
    file_size: photo.file_size,
    width: photo.width,
    height: photo.height,
    mime_type: photo.mime_type,
    caption: photo.caption,
    is_featured: photo.is_featured,
    likes_count: photo.likes_count,
    views_count: photo.views_count,
    download_count: photo.download_count,
    created_at: photo.created_at,
    display_order: photo.display_order,
    event: {
      id: photo.events.id,
      name: photo.events.name,
    },
  }));

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
            href={`/admin/events/${event_id}/photos/upload`}
            className="inline-flex items-center rounded-lg bg-[#54ACBF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#54ACBF]/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Link>
        </div>

        {/* Photo Grid with Drag & Drop */}
        {formattedPhotos.length > 0 ? (
          <AdminErrorBoundary errorContext="Photo Management Grid">
            <DraggablePhotoGrid
              photos={formattedPhotos}
              event_id={event_id}
              currentSort={sort}
              currentFilter={resolvedSearchParams.filter}
              currentSearch={resolvedSearchParams.search}
            />
          </AdminErrorBoundary>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No photos yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by uploading photos to this event.
            </p>
            <Link
              href={`/admin/events/${event_id}/photos/upload`}
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
