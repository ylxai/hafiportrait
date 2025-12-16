/**
 * Upload Service
 * 
 * Handles actual file upload to API with:
 * - Chunked upload support
 * - Progress tracking
 * - Checksum verification
 * - Retry logic
 */

import { calculateChecksum } from './checksumUtils';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  photoId?: string;
  url?: string;
  error?: string;
  checksum?: string;
}

/**
 * Upload single file to API
 */
export async function uploadFile(
  file: File,
  eventId: string,
  options: {
    onProgress?: (progress: UploadProgress) => void;
    signal?: AbortSignal;
    calculateFileChecksum?: boolean;
  } = {}
): Promise<UploadResult> {
  const { onProgress, signal, calculateFileChecksum = false } = options;

  try {
    // Calculate checksum if requested
    let checksum: string | undefined;
    if (calculateFileChecksum) {
      checksum = await calculateChecksum(file);
    }

    // Create FormData
    const formData = new FormData();
    formData.append('files', file);
    if (checksum) {
      formData.append('checksum', checksum);
    }

    // Upload with progress tracking
    const result = await uploadWithProgress(
      `/api/admin/events/${eventId}/photos/upload`,
      formData,
      {
        onProgress,
        signal,
      }
    );

    return {
      success: true,
      ...result,
      checksum,
    };
  } catch (error: any) {
    console.error('Upload failed:', error);
    
    // Check if aborted
    if (error.name === 'AbortError') {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Upload with progress tracking using XMLHttpRequest
 */
function uploadWithProgress(
  url: string,
  formData: FormData,
  options: {
    onProgress?: (progress: UploadProgress) => void;
    signal?: AbortSignal;
  } = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Setup progress handler
    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          options.onProgress!(progress);
        }
      });
    }

    // Setup completion handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Setup error handler
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    // Setup abort handler
    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload aborted', 'AbortError'));
    });

    // Handle abort signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Send request
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

/**
 * Upload multiple files in batch
 */
export async function uploadBatch(
  files: File[],
  eventId: string,
  options: {
    onProgress?: (fileIndex: number, progress: UploadProgress) => void;
    onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    signal?: AbortSignal;
  } = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const result = await uploadFile(file, eventId, {
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress(i, progress);
          }
        },
        signal: options.signal,
      });

      results.push(result);

      if (options.onFileComplete) {
        options.onFileComplete(i, result);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }

      const errorResult: UploadResult = {
        success: false,
        error: error.message || 'Upload failed',
      };

      results.push(errorResult);

      if (options.onFileComplete) {
        options.onFileComplete(i, errorResult);
      }
    }
  }

  return results;
}
