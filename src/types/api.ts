// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Event Types
export interface EventFormData {
  name: string;
  date: string;
  access_code: string;
  is_premium: boolean;
}

export interface EventResponse {
  id: string;
  name: string;
  date: string;
  access_code: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

// Photo Types
export interface PhotoUploadResponse {
  id: string;
  url: string;
  original_name: string;
  event_id?: string;
  is_homepage: boolean;
  created_at: string;
}

// Stats Types
export interface AdminStats {
  totalEvents: number;
  totalPhotos: number;
  totalMessages: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'event' | 'photo' | 'message';
  description: string;
  timestamp: string;
}