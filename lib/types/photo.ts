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
  original_url: string
  thumbnail_url: string | null
  thumbnail_small_url: string | null
  thumbnail_medium_url: string | null
  thumbnail_large_url: string | null
  file_size: number | null
  mime_type: string | null
  width: number | null
  height: number | null
  display_order: number
  caption: string | null
  deleted_at: Date | null
  event_id: string
  created_at: Date
  updated_at: Date
}

/**
 * Photo with EXIF Metadata
 */
export interface PhotoWithMetadata extends Photo {
  exif_data: {
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
  original_url: string
  thumbnail_url?: string
  thumbnail_small_url?: string
  thumbnail_medium_url?: string
  thumbnail_large_url?: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  caption?: string
  display_order?: number
  exif_data?: Record<string, any>
  event_id: string
}

/**
 * Photo Analytics Interface - Engagement data
 */
export interface PhotoAnalytics {
  photo_id: string
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
  thumbnail_url: string | null
  thumbnail_medium_url: string | null
  display_order: number
  likes: number
  comments: number
  views: number
}

/**
 * Photo Gallery Item - For public gallery display
 */
export interface PhotoGalleryItem {
  id: string
  thumbnail_url: string | null
  thumbnail_medium_url: string | null
  thumbnail_large_url: string | null
  original_url: string
  caption: string | null
  display_order: number
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
  return 'exif_data' in photo && photo.exif_data !== null
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
    original_url: photo.original_url,
    thumbnail_url: photo.thumbnail_url,
    thumbnail_small_url: photo.thumbnail_small_url,
    thumbnail_medium_url: photo.thumbnail_medium_url,
    thumbnail_large_url: photo.thumbnail_large_url,
    file_size: photo.file_size,
    mime_type: photo.mime_type,
    width: photo.width,
    height: photo.height,
    display_order: photo.display_order,
    caption: photo.caption,
    deleted_at: photo.deleted_at,
    event_id: photo.event_id,
    created_at: photo.created_at,
    updated_at: photo.updated_at,
  }
}
