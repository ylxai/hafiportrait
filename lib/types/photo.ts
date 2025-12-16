/**
 * Centralized Photo Type Definitions
 * Single source of truth for all photo-related types
 */

import { Photo as PrismaPhoto, Event } from '@prisma/client'

/**
 * Base Photo Interface - Core photo properties
 */
export interface Photo {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl: string | null
  thumbnailSmallUrl: string | null
  thumbnailMediumUrl: string | null
  thumbnailLargeUrl: string | null
  fileSize: number | null
  mimeType: string | null
  width: number | null
  height: number | null
  displayOrder: number
  caption: string | null
  deletedAt: Date | null
  eventId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Photo with EXIF Metadata
 */
export interface PhotoWithMetadata extends Photo {
  exifData: {
    make?: string
    model?: string
    exposureTime?: string
    fNumber?: string
    iso?: number
    focalLength?: string
    lens?: string
    dateTimeOriginal?: string
    gpsLatitude?: number
    gpsLongitude?: number
    [key: string]: any
  } | null
}

/**
 * Photo with Event Information
 */
export interface PhotoWithEvent extends Photo {
  event: {
    id: string
    name: string
    slug: string
    eventCode: string
    date: Date
    status: string
  }
}

/**
 * Photo Upload Interface - For upload operations
 */
export interface PhotoUpload {
  filename: string
  originalUrl: string
  thumbnailUrl?: string
  thumbnailSmallUrl?: string
  thumbnailMediumUrl?: string
  thumbnailLargeUrl?: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  caption?: string
  displayOrder?: number
  exifData?: Record<string, any>
  eventId: string
}

/**
 * Photo Analytics Interface - Engagement data
 */
export interface PhotoAnalytics {
  photoId: string
  views: number
  likes: number
  comments: number
  downloads: number
  engagement: {
    totalInteractions: number
    engagementRate: number
    lastViewedAt: Date | null
    lastLikedAt: Date | null
    lastCommentedAt: Date | null
    lastDownloadedAt: Date | null
  }
}

/**
 * Photo with Analytics
 */
export interface PhotoWithAnalytics extends Photo {
  analytics: PhotoAnalytics
  _count?: {
    likes: number
    comments: number
    downloads: number
    views: number
  }
}

/**
 * Photo List Item - Optimized for lists
 */
export interface PhotoListItem {
  id: string
  filename: string
  thumbnailUrl: string | null
  thumbnailMediumUrl: string | null
  displayOrder: number
  likes: number
  comments: number
  views: number
}

/**
 * Photo Gallery Item - For public gallery display
 */
export interface PhotoGalleryItem {
  id: string
  thumbnailUrl: string | null
  thumbnailMediumUrl: string | null
  thumbnailLargeUrl: string | null
  originalUrl: string
  caption: string | null
  displayOrder: number
  width: number | null
  height: number | null
  likes: number
  hasLiked: boolean
  allowDownload: boolean
  allowLike: boolean
}

/**
 * Type guard to check if photo has metadata
 */
export function hasMetadata(photo: Photo | PhotoWithMetadata): photo is PhotoWithMetadata {
  return 'exifData' in photo && photo.exifData !== null
}

/**
 * Type guard to check if photo has analytics
 */
export function hasAnalytics(photo: Photo | PhotoWithAnalytics): photo is PhotoWithAnalytics {
  return 'analytics' in photo
}

/**
 * Convert Prisma Photo to Photo type
 */
export function toPrismaPhoto(photo: PrismaPhoto): Photo {
  return {
    id: photo.id,
    filename: photo.filename,
    originalUrl: photo.originalUrl,
    thumbnailUrl: photo.thumbnailUrl,
    thumbnailSmallUrl: photo.thumbnailSmallUrl,
    thumbnailMediumUrl: photo.thumbnailMediumUrl,
    thumbnailLargeUrl: photo.thumbnailLargeUrl,
    fileSize: photo.fileSize,
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    displayOrder: photo.displayOrder,
    caption: photo.caption,
    deletedAt: photo.deletedAt,
    eventId: photo.eventId,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt,
  }
}
