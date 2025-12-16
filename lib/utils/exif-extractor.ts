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
    const exifData: ExifData = {};

    // Extract camera information
    if (exifParsed.image) {
      if (exifParsed.image.Make) exifData.make = exifParsed.image.Make.toString().trim();
      if (exifParsed.image.Model) exifData.model = exifParsed.image.Model.toString().trim();
      if (exifParsed.image.Software) exifData.software = exifParsed.image.Software.toString();
      if (exifParsed.image.Orientation) exifData.orientation = exifParsed.image.Orientation;
    }

    // Extract photo settings from EXIF
    if (exifParsed.exif) {
      // ISO
      if (exifParsed.exif.ISO) {
        exifData.iso = exifParsed.exif.ISO;
      }

      // Aperture/F-Number
      if (exifParsed.exif.FNumber) {
        exifData.fNumber = exifParsed.exif.FNumber;
        exifData.aperture = `f/${exifParsed.exif.FNumber.toFixed(1)}`;
      }

      // Shutter Speed/Exposure Time
      if (exifParsed.exif.ExposureTime) {
        const exposureTime = exifParsed.exif.ExposureTime;
        exifData.exposureTime = exposureTime.toString();
        
        if (exposureTime < 1) {
          exifData.shutterSpeed = `1/${Math.round(1 / exposureTime)}s`;
        } else {
          exifData.shutterSpeed = `${exposureTime}s`;
        }
      }

      // Focal Length
      if (exifParsed.exif.FocalLength) {
        exifData.focalLength = `${exifParsed.exif.FocalLength}mm`;
      }

      // Date & Time
      if (exifParsed.exif.DateTimeOriginal) {
        exifData.dateTimeOriginal = exifParsed.exif.DateTimeOriginal.toString();
      }
      if (exifParsed.exif.DateTimeDigitized) {
        exifData.dateTimeDigitized = exifParsed.exif.DateTimeDigitized.toString();
      }
      if (exifParsed.exif.DateTime) {
        exifData.dateTime = exifParsed.exif.DateTime.toString();
      }
    }

    // Extract GPS data
    if (exifParsed.gps) {
      if (exifParsed.gps.GPSLatitude) exifData.gpsLatitude = exifParsed.gps.GPSLatitude;
      if (exifParsed.gps.GPSLongitude) exifData.gpsLongitude = exifParsed.gps.GPSLongitude;
      if (exifParsed.gps.GPSAltitude) exifData.gpsAltitude = exifParsed.gps.GPSAltitude;
    }

    // Return null if no data was extracted
    if (Object.keys(exifData).length === 0) {
      return null;
    }

    return exifData;
    
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
}

/**
 * Fallback EXIF extraction using Sharp metadata only
 */
function extractBasicExif(metadata: sharp.Metadata): ExifData | null {
  const exifData: ExifData = {};

  if (metadata.orientation) {
    exifData.orientation = metadata.orientation;
  }

  return Object.keys(exifData).length > 0 ? exifData : null;
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
