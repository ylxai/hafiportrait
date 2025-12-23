/**
 * EXIF Data Extraction Utility
 * Extracts EXIF metadata from images using Sharp
 * SERVER-SIDE ONLY - Do not import in client components
 */

import sharp from 'sharp';

export interface ExifData {
  // Camera information
  make?: string;
  model?: string;
  
  // Photo settings
  iso?: number;
  aperture?: string;
  fNumber?: number;
  shutterSpeed?: string;
  exposureTime?: string;
  focalLength?: string;
  
  // Date & time
  dateTime?: string;
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;
  
  // Image properties
  orientation?: number;
  software?: string;
  
  // GPS data (optional)
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
}

/**
 * Extract EXIF data from image buffer using Sharp and exif-reader
 * @param buffer Image buffer
 * @returns Extracted EXIF data or null
 */
export async function extractExifData(buffer: Buffer): Promise<ExifData | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.exif) {
      return null;
    }

    // Use exif-reader to parse EXIF buffer
    let exifReader;
    try {
      exifReader = require('exif-reader');
    } catch (e) {
      return extractBasicExif(metadata);
    }

    const exifParsed = exifReader(metadata.exif);
    const exif_data: ExifData = {};

    // Extract camera information
    if (exifParsed.image) {
      if (exifParsed.image.Make) exif_data.make = exifParsed.image.Make.toString().trim();
      if (exifParsed.image.Model) exif_data.model = exifParsed.image.Model.toString().trim();
      if (exifParsed.image.Software) exif_data.software = exifParsed.image.Software.toString();
      if (exifParsed.image.Orientation) exif_data.orientation = exifParsed.image.Orientation;
    }

    // Extract photo settings from EXIF
    if (exifParsed.exif) {
      // ISO
      if (exifParsed.exif.ISO) {
        exif_data.iso = exifParsed.exif.ISO;
      }

      // Aperture/F-Number
      if (exifParsed.exif.FNumber) {
        exif_data.fNumber = exifParsed.exif.FNumber;
        exif_data.aperture = `f/${exifParsed.exif.FNumber.toFixed(1)}`;
      }

      // Shutter Speed/Exposure Time
      if (exifParsed.exif.ExposureTime) {
        const exposureTime = exifParsed.exif.ExposureTime;
        exif_data.exposureTime = exposureTime.toString();
        
        if (exposureTime < 1) {
          exif_data.shutterSpeed = `1/${Math.round(1 / exposureTime)}s`;
        } else {
          exif_data.shutterSpeed = `${exposureTime}s`;
        }
      }

      // Focal Length
      if (exifParsed.exif.FocalLength) {
        exif_data.focalLength = `${exifParsed.exif.FocalLength}mm`;
      }

      // Date & Time
      if (exifParsed.exif.DateTimeOriginal) {
        exif_data.dateTimeOriginal = exifParsed.exif.DateTimeOriginal.toString();
      }
      if (exifParsed.exif.DateTimeDigitized) {
        exif_data.dateTimeDigitized = exifParsed.exif.DateTimeDigitized.toString();
      }
      if (exifParsed.exif.DateTime) {
        exif_data.dateTime = exifParsed.exif.DateTime.toString();
      }
    }

    // Extract GPS data
    if (exifParsed.gps) {
      if (exifParsed.gps.GPSLatitude) exif_data.gpsLatitude = exifParsed.gps.GPSLatitude;
      if (exifParsed.gps.GPSLongitude) exif_data.gpsLongitude = exifParsed.gps.GPSLongitude;
      if (exifParsed.gps.GPSAltitude) exif_data.gpsAltitude = exifParsed.gps.GPSAltitude;
    }

    // Return null if no data was extracted
    if (Object.keys(exif_data).length === 0) {
      return null;
    }

    return exif_data;
    
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
}

/**
 * Fallback EXIF extraction using Sharp metadata only
 */
function extractBasicExif(metadata: sharp.Metadata): ExifData | null {
  const exif_data: ExifData = {};

  if (metadata.orientation) {
    exif_data.orientation = metadata.orientation;
  }

  return Object.keys(exif_data).length > 0 ? exif_data : null;
}

/**
 * Extract basic image metadata (without EXIF)
 * @param buffer Image buffer
 * @returns Basic metadata
 */
export async function extractBasicMetadata(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Error extracting basic metadata:', error);
    return null;
  }
}

/**
 * Format EXIF data for display (CLIENT-SAFE)
 * This function can be used in client components
 * @param exif_data EXIF data object
 * @returns Formatted string
 */
export function formatExifForDisplay(exif_data: ExifData | null | undefined): Record<string, string> {
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
