'use client';

import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  _count: {
    photos: number;
  };
}

interface TrashFilterProps {
  events: Event[];
  currentEventId?: string;
  totalCount: number;
}

export default function TrashFilter({ events, currentEventId, totalCount }: TrashFilterProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <label htmlFor="eventFilter" className="mb-2 block text-sm font-medium text-gray-700">
        Filter by Event:
      </label>
      <select
        id="eventFilter"
        value={currentEventId || ''}
        onChange={(e) => {
          const newEventId = e.target.value;
          const url = newEventId
            ? `/admin/photos/trash?event_id=${newEventId}`
            : '/admin/photos/trash';
          router.push(url);
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
  );
}
