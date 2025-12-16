/**
 * EXIF Formatter Utility (CLIENT-SAFE)
 * Format EXIF data for display in client components
 */

/**
 * Format EXIF data for display
 * This function can be used in client components
 * @param exifData EXIF data object
 * @returns Formatted string
 */
export function formatExifForDisplay(exifData: any): Record<string, string> {
  const formatted: Record<string, string> = {};

  if (!exifData) return formatted;

  if (exifData.make) formatted['Camera Make'] = exifData.make;
  if (exifData.model) formatted['Camera Model'] = exifData.model;
  if (exifData.iso) formatted['ISO'] = exifData.iso.toString();
  if (exifData.aperture) formatted['Aperture'] = exifData.aperture;
  if (exifData.shutterSpeed) formatted['Shutter Speed'] = exifData.shutterSpeed;
  if (exifData.focalLength) formatted['Focal Length'] = exifData.focalLength;
  if (exifData.dateTimeOriginal) formatted['Date Taken'] = exifData.dateTimeOriginal;
  if (exifData.software) formatted['Software'] = exifData.software;

  return formatted;
}
