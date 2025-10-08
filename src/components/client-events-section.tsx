'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import UniversalSkeleton from "@/components/reactbits/skeleton/UniversalSkeleton";

// Dynamic import dengan no SSR untuk menghindari hydration mismatch
const EventsSection = dynamic(() => import('./events-section'), {
  ssr: false,
  loading: () => <UniversalSkeleton type="events" className="w-full h-96" animated={true} />
});

export default function ClientEventsSection() {
  return (
    <Suspense fallback={<UniversalSkeleton type="events" className="w-full h-96" animated={true} />}>
      <EventsSection />
    </Suspense>
  );
}