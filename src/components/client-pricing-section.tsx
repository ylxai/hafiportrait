'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import dengan no SSR untuk menghindari hydration mismatch
const SpotlightPricingSection = dynamic(() => import('./spotlight-pricing-section'), {
  ssr: false,
  loading: () => (
    <section className="py-20 px-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="max-w-7xl mx-auto text-center">
        <div className="text-white">Loading packages...</div>
      </div>
    </section>
  )
});

export default function ClientPricingSection() {
  return (
    <Suspense fallback={
      <section className="py-20 px-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-white">Loading packages...</div>
        </div>
      </section>
    }>
      <SpotlightPricingSection />
    </Suspense>
  );
}