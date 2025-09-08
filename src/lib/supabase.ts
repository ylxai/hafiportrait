import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Safe environment variable access with fallbacks
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not found, using fallback');
    return 'https://azspktldiblhrwebzmwq.supabase.co'; // Fallback
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  }
  return key;
};

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }
  return key;
};

// Create Supabase client for client-side operations (lazy loading)
export const supabase = createSupabaseClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

// Create Supabase admin client for server-side operations (lazy loading)
export const supabaseAdmin = createSupabaseClient(
  getSupabaseUrl(),
  getSupabaseServiceKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Export createClient function for API routes
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Storage bucket name
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'photos'; // Menggunakan default 'photos'

// Upload file to Supabase Storage
export async function uploadFile(file: File, path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

// Delete file from Supabase Storage
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// Generate unique file path
export function generateFilePath(
  folder: string, 
  originalName: string, 
  eventId?: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileExtension = originalName.split('.').pop();
  const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
  
  if (eventId) {
    return `${folder}/${eventId}/${fileName}`;
  }
  
  return `${folder}/${fileName}`;
} 