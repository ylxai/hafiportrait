/**
 * Hook for managing guest identifier
 */

import { useEffect, useState } from 'react';
import { getGuestId } from '@/lib/guest-storage';

export function useGuestIdentifier() {
  const [guestId, setGuestId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get or create guest ID on mount
    const id = getGuestId();
    setGuestId(id);
    setIsLoading(false);
  }, []);

  return {
    guestId,
    isLoading,
  };
}
