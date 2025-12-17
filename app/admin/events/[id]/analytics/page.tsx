/**
 * Event Analytics Dashboard
 * Displays engagement metrics and analytics for event
 */

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getEventEngagementAnalytics } from '@/lib/services/engagement-analytics';
import EngagementDashboard from '@/components/admin/analytics/EngagementDashboard';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventAnalyticsPage({ params }: PageProps) {
  const { id: event_id } = await params;

  // Verify event exists
  const event = await prisma.events.findUnique({
    where: { id: event_id },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  if (!event) {
    redirect('/admin/events');
  }

  // Get analytics data
  const analytics = await getEventEngagementAnalytics(event_id, {
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Engagement Analytics
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
        </div>

        {/* Dashboard */}
        <EngagementDashboard 
          event_id={event_id}
          eventSlug={event.slug}
          initialData={analytics}
        />
      </div>
    </div>
  );
}
