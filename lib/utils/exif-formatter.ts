/**
 * EXIF Formatter Utility (CLIENT-SAFE)
 * Format EXIF data for display in client components
 */

/**
 * Format EXIF data for display
 * This function can be used in client components
 * @param exif_data EXIF data object
 * @returns Formatted string
 */
export function formatExifForDisplay(exif_data: any): Record<string, string> {
  const formatted: Record<string, string> = {};

  if (!exif_data) return formatted;

  if (exif_data.make) formatted['Camera Make'] = exif_data.make;
  if (exif_data.model) formatted['Camera Model'] = exif_data.model;
  if (exif_data.iso) formatted['ISO'] = exif_data.iso.toString();
  if (exif_data.aperture) formatted['Aperture'] = exif_data.aperture;
  if (exif_data.shutterSpeed) formatted['Shutter Speed'] = exif_data.shutterSpeed;
  if (exif_data.focalLength) formatted['Focal Length'] = exif_data.focalLength;
  if (exif_data.dateTimeOriginal) formatted['Date Taken'] = exif_data.dateTimeOriginal;
  if (exif_data.software) formatted['Software'] = exif_data.software;

  return formatted;
}
