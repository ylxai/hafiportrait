/**
 * API Response Type Definitions
 */

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: Record<string, unknown>
    field?: string
    timestamp?: string
    requestId?: string
  }
}

/**
 * Validation Error Response
 */
export interface ValidationErrorResponse {
  success: false
  error: {
    message: string
    code: 'VALIDATION_ERROR'
    details: Array<{
      field: string
      message: string
      code?: string
    }>
  }
}

/**
 * API Response Union Type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse | ValidationErrorResponse

// ===================================================================
// SPECIFIC API RESPONSE INTERFACES
// ===================================================================

/**
 * Event API Response Types
 */
export interface EventData {
  id: string
  name: string
  description: string | null
  date: string
  slug: string
  access_code: string
  is_active: boolean
  cover_photo_id: string | null
  coverPhotoUrl: string | null
  photosCount: number
  views_count: number
  downloadsCount: number
  created_at: string
  updated_at: string
}

export interface EventListData {
  events: EventData[]
  total: number
  hasMore: boolean
}

export type EventApiResponse = ApiResponse<EventData>
export type EventListApiResponse = ApiResponse<EventListData>

/**
 * Photo API Response Types
 */
export interface PhotoData {
  id: string
  filename: string
  original_url: string
  thumbnail_url: string | null
  mediumUrl: string | null
  file_size: number | null
  width: number | null
  height: number | null
  mime_type: string | null
  display_order: number
  event_id: string
  uploadedAt: string
  updated_at: string
  likes_count: number
  download_count: number
  isDeleted: boolean
  deleted_at: string | null
  exif_data: Record<string, unknown> | null
}

export interface PhotoListData {
  photos: PhotoData[]
  total: number
  hasMore: boolean
}

export interface PhotoUploadData {
  uploadedPhotos: PhotoData[]
  failedUploads: Array<{
    filename: string
    error: string
  }>
  totalUploaded: number
  totalFailed: number
}

export type PhotoApiResponse = ApiResponse<PhotoData>
export type PhotoListApiResponse = ApiResponse<PhotoListData>
export type PhotoUploadApiResponse = ApiResponse<PhotoUploadData>

/**
 * Package API Response Types
 */
export interface PackageData {
  id: string
  name: string
  description: string | null
  price: number
  features: string[]
  isBestSeller: boolean
  is_active: boolean
  display_order: number
  categoryId: string
  category: {
    id: string
    name: string
    slug: string
  }
  created_at: string
  updated_at: string
}

export interface PackageCategoryData {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  packages: PackageData[]
}

export interface PackagesData {
  categories: PackageCategoryData[]
  additionalServices: Array<{
    id: string
    name: string
    price: number
    description: string | null
  }>
}

export type PackageApiResponse = ApiResponse<PackageData>
export type PackagesApiResponse = ApiResponse<PackagesData>

/**
 * User/Auth API Response Types
 */
export interface UserData {
  id: string
  username: string
  email: string
  role: 'ADMIN' | 'CLIENT'
  created_at: string
  lastLoginAt: string | null
}

export interface AuthData {
  user: UserData
  token: string
  expiresAt: string
}

export type AuthApiResponse = ApiResponse<AuthData>
export type UserApiResponse = ApiResponse<UserData>

/**
 * Dashboard API Response Types
 */
export interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalPhotos: number
  totalViews: number
  totalDownloads: number
  totalMessages: number
  newMessages: number
}

export interface RecentEventData {
  id: string
  name: string
  date: string
  photosCount: number
  views_count: number
  is_active: boolean
}

export interface DashboardData {
  statistics: DashboardStats
  recentEvents: RecentEventData[]
}

export type DashboardApiResponse = ApiResponse<DashboardData>

/**
 * Form Submission API Response Types
 */
export interface FormSubmissionData {
  id: string
  name: string
  whatsapp: string
  email: string
  packageInterest: string | null
  weddingDate: string | null
  message: string
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'CLOSED'
  notes: string | null
  submittedAt: string
  updated_at: string
}

export type FormSubmissionApiResponse = ApiResponse<FormSubmissionData>
export type FormSubmissionListApiResponse = ApiResponse<{ submissions: FormSubmissionData[], total: number }>

/**
 * Contact/Message API Response Types
 */
export interface ContactMessageData {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'
  created_at: string
  updated_at: string
}

export type ContactMessageApiResponse = ApiResponse<ContactMessageData>
export type ContactMessageListApiResponse = ApiResponse<{ messages: ContactMessageData[], total: number }>
