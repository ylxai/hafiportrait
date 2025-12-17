/**
 * Guest Storage Utilities
 * Manages guest identifier and like state in localStorage
 */

const GUEST_ID_KEY = 'hafiportrait_guest_id';
const GUEST_LIKES_KEY = 'hafiportrait_guest_likes';

/**
 * Generate unique guest identifier
 */
export function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create guest identifier
 */
export function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  
  return guestId;
}

/**
 * Get liked photo IDs for current guest
 */
export function getLikedPhotos(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  try {
    const stored = localStorage.getItem(GUEST_LIKES_KEY);
    if (!stored) return new Set();
    
    const likedArray = JSON.parse(stored) as string[];
    return new Set(likedArray);
  } catch (error) {
    console.error('Error reading liked photos from localStorage:', error);
    return new Set();
  }
}

/**
 * Save liked photo IDs to localStorage
 */
export function saveLikedPhotos(likedPhotos: Set<string>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const likedArray = Array.from(likedPhotos);
    localStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(likedArray));
  } catch (error) {
    console.error('Error saving liked photos to localStorage:', error);
  }
}

/**
 * Add photo to liked list
 */
export function addLikedPhoto(photo_id: string): void {
  const liked = getLikedPhotos();
  liked.add(photo_id);
  saveLikedPhotos(liked);
}

/**
 * Remove photo from liked list
 */
export function removeLikedPhoto(photo_id: string): void {
  const liked = getLikedPhotos();
  liked.delete(photo_id);
  saveLikedPhotos(liked);
}

/**
 * Check if photo is liked by current guest
 */
export function isPhotoLiked(photo_id: string): boolean {
  const liked = getLikedPhotos();
  return liked.has(photo_id);
}

/**
 * Clear all guest data (for testing)
 */
export function clearGuestData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(GUEST_LIKES_KEY);
}
