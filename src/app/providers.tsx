'use client'; // Pastikan ini di baris pertama

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create QueryClient instance outside component to avoid re-creation
// Use function to ensure fresh instance in production
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable refetch on window focus in production
        refetchOnWindowFocus: false,
        // Retry failed requests
        retry: 1,
        // Stale time
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may suspend because
  // React will throw away the client on the initial render if it suspends and
  // there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 