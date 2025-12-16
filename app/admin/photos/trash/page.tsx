/**
 * Trash/Recycle Bin Page
 * /admin/photos/trash
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import TrashPhotoGrid from '@/components/admin/TrashPhotoGrid';
import Link from 'next/link';
import { ChevronRight, Trash2 } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    eventId?: string;
  }>;
}

export default async function TrashPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const eventId = resolvedSearchParams.eventId;

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

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true, id: true },
  });

  if (!user) {
    redirect('/admin/login');
  }

  const isAdmin = user.role === 'ADMIN';

  // Build where clause for deleted photos
  const where: any = {
    deletedAt: { not: null },
  };

  // Filter by event if specified
  if (eventId) {
    where.eventId = eventId;
  }

  // Non-admin users can only see their own event photos
  if (!isAdmin) {
    where.event = {
      clientId: decoded.userId,
    };
  }

  // Fetch deleted photos with pagination
  const limit = 50;
  const skip = (page - 1) * limit;

  const [photos, totalCount] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        deletedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.photo.count({ where }),
  ]);

  // Calculate how many photos are ready for permanent deletion (> 30 days old)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const readyForCleanupCount = await prisma.photo.count({
    where: {
      ...where,
      deletedAt: {
        not: null,
        lte: thirtyDaysAgo,
      },
    },
  });

  // Get list of events for filter dropdown
  const events = await prisma.event.findMany({
    where: isAdmin ? {} : { clientId: decoded.userId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          photos: {
            where: {
              deletedAt: { not: null },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/admin/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-gray-900">Trash</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <Trash2 className="mr-3 h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
              <p className="mt-1 text-sm text-gray-600">
                {totalCount} foto terhapus • {readyForCleanupCount} siap untuk dihapus permanen
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              💡 Foto di trash akan dihapus secara otomatis setelah 30 hari. 
              Anda bisa me-restore foto sebelum waktu tersebut.
            </p>
          </div>
        </div>

        {/* Event Filter */}
        {events.length > 0 && (
          <div className="mb-6">
            <label htmlFor="eventFilter" className="mb-2 block text-sm font-medium text-gray-700">
              Filter by Event:
            </label>
            <select
              id="eventFilter"
              value={eventId || ''}
              onChange={(e) => {
                const newEventId = e.target.value;
                const url = newEventId 
                  ? `/admin/photos/trash?eventId=${newEventId}`
                  : '/admin/photos/trash';
                window.location.href = url;
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#54ACBF] focus:outline-none focus:ring-2 focus:ring-[#54ACBF]"
            >
              <option value="">All Events ({totalCount})</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event._count.photos})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <>
            <TrashPhotoGrid photos={photos} isAdmin={isAdmin} />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/photos/trash?page=${page - 1}${eventId ? `&eventId=${eventId}` : ''}`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                
                {page < totalPages && (
                  <Link
                    href={`/admin/photos/trash?page=${page + 1}${eventId ? `&eventId=${eventId}` : ''}`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Trash kosong</h3>
            <p className="mt-2 text-sm text-gray-500">
              Tidak ada foto yang dihapus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
