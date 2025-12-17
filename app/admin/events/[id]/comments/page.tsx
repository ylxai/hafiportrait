/**
 * Admin Comment Moderation Dashboard
 * Allows admins to review and moderate guest comments
 */

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentModerationTable from '@/components/admin/comments/CommentModerationTable';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CommentModerationPage({ params }: PageProps) {
  const { id: event_id } = await params;

  // Verify event exists
  const event = await prisma.events.findUnique({
    where: { id: event_id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!event) {
    redirect('/admin/events');
  }

  // Get initial comments data
  const [comments, totalCount, pendingCount] = await Promise.all([
    prisma.comments.findMany({
      where: { event_id: event_id },
      select: {
        id: true,
        guest_name: true,
        email: true,
        message: true,
        relationship: true,
        status: true,
        created_at: true,
        photos: {
          select: {
            filename: true,
            thumbnail_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    }),
    prisma.comments.count({ where: { event_id: event_id } }),
    prisma.comments.count({ where: { event_id: event_id, status: 'pending' } }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Comment Moderation
              </h1>
              <p className="mt-2 text-gray-600">{event.name}</p>
            </div>
            <a
              href={`/admin/events/${event_id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back to Event
            </a>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Comments</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {totalCount - pendingCount}
              </p>
            </div>
          </div>
        </div>

        {/* Moderation Table */}
        <CommentModerationTable
          event_id={event_id}
          initialComments={comments}
          initialTotalCount={totalCount}
          initialPendingCount={pendingCount}
        />
      </div>
    </div>
  );
}
