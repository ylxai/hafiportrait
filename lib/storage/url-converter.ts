/**
 * URL Converter Utility
 * Converts between VPS and R2 URLs for optimal delivery
 */

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev';
const VPS_STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://hafiportrait.photography/storage';

/**
 * Convert VPS storage URL to R2 CDN URL
 * For fast downloads via Cloudflare CDN
 * 
 * @param vpsUrl - VPS storage URL
 * @returns R2 CDN URL
 * 
 * @example
 * Input:  https://hafiportrait.photography/storage/events/xxx/photos/originals/file.jpg
 * Output: https://pub-xxx.r2.dev/events/xxx/photos/originals/file.jpg
 */
export function convertVpsToR2Url(vpsUrl: string): string {
  if (!vpsUrl) return vpsUrl;
  
  // If already R2 URL, return as-is
  if (vpsUrl.includes('.r2.dev')) {
    return vpsUrl;
  }
  
  // If VPS URL, convert to R2
  if (vpsUrl.includes(VPS_STORAGE_URL)) {
    // Extract path after /storage/
    const path = vpsUrl.split('/storage/')[1];
    if (path) {
      return `${R2_PUBLIC_URL}/${path}`;
    }
  }
  
  // If neither, return as-is (fallback)
  return vpsUrl;
}

/**
 * Convert R2 CDN URL to VPS storage URL
 * For backup/redundancy access
 * 
 * @param r2Url - R2 CDN URL
 * @returns VPS storage URL
 */
export function convertR2ToVpsUrl(r2Url: string): string {
  if (!r2Url) return r2Url;
  
  // If already VPS URL, return as-is
  if (r2Url.includes('hafiportrait.photography')) {
    return r2Url;
  }
  
  // If R2 URL, convert to VPS
  if (r2Url.includes('.r2.dev')) {
    // Extract path after domain
    const match = r2Url.match(/\.r2\.dev\/(.+)/);
    if (match && match[1]) {
      return `${VPS_STORAGE_URL}/${match[1]}`;
    }
  }
  
  // If neither, return as-is (fallback)
  return r2Url;
}

/**
 * Get download URL (prefer R2 for speed)
 * 
 * @param originalUrl - Original URL from database
 * @returns Best URL for downloading
 */
export function getDownloadUrl(originalUrl: string): string {
  // For downloads, always use R2 (fast CDN)
  return convertVpsToR2Url(originalUrl);
}

/**
 * Get display URL (can use either)
 * 
 * @param originalUrl - Original URL from database
 * @returns URL for display/preview
 */
export function getDisplayUrl(originalUrl: string): string {
  // For display, can use VPS or R2 (both work)
  // Currently returning as-is
  return originalUrl;
}
