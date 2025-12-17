/**
 * Upload Persistence Module
 * 
 * Manages upload state persistence in localStorage with:
 * - Session management
 * - Progress tracking
 * - Storage quota management
 * - Data cleanup
 */

export interface UploadFileState {
  id: string;
  file: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'paused';
  uploadedChunks: number[];
  totalChunks: number;
  checksum?: string;
  error?: string;
  retryCount: number;
  lastRetry?: number;
  uploadedBytes?: number;
}

export interface UploadSession {
  sessionId: string;
  event_id: string;
  files: UploadFileState[];
  created_at: number;
  updated_at: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
}

export interface UploadHistory {
  sessionId: string;
  event_id: string;
  completedAt: number;
  fileCount: number;
  totalSize: number;
}

const STORAGE_KEY_PREFIX = 'hafiportrait_upload_';
const SESSION_KEY = `${STORAGE_KEY_PREFIX}session`;
const HISTORY_KEY = `${STORAGE_KEY_PREFIX}history`;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_AGE_DAYS = 7;
const STORAGE_QUOTA_CHECK_INTERVAL = 5; // Check every 5 operations

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get estimated localStorage usage
 */
export function getStorageUsage(): { used: number; available: number; percentage: number } {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: 0, percentage: 0 };
  }

  try {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // Typical localStorage limit is 5-10MB, we'll assume 5MB
    const estimatedLimit = 5 * 1024 * 1024;
    const percentage = (totalSize / estimatedLimit) * 100;

    return {
      used: totalSize,
      available: estimatedLimit - totalSize,
      percentage: Math.min(percentage, 100),
    };
  } catch (e) {
    console.error('Error calculating storage usage:', e);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Compress upload state by removing unnecessary data
 */
function compressUploadState(session: UploadSession): UploadSession {
  return {
    ...session,
    files: session.files.map(file => ({
      ...file,
      // Remove completed files from storage to save space
      uploadedChunks: file.status === 'completed' ? [] : file.uploadedChunks,
    })),
  };
}

/**
 * Save upload state to localStorage
 */
export function saveUploadState(session: UploadSession): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    // Update timestamp
    session.updated_at = Date.now();

    // Compress before saving
    const compressed = compressUploadState(session);

    // Save to localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(compressed));

    // Check storage quota periodically
    if (Math.random() < 1 / STORAGE_QUOTA_CHECK_INTERVAL) {
      const usage = getStorageUsage();
      if (usage.percentage > 80) {
        console.warn(`Storage usage is high: ${usage.percentage.toFixed(1)}%`);
        cleanupOldSessions();
      }
    }

    return true;
  } catch (e) {
    console.error('Error saving upload state:', e);
    
    // If quota exceeded, try cleanup and retry once
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      cleanupOldSessions();
      
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(compressUploadState(session)));
        return true;
      } catch (retryError) {
        console.error('Failed to save even after cleanup:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Load upload state from localStorage
 */
export function loadUploadState(): UploadSession | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) {
      return null;
    }

    const session: UploadSession = JSON.parse(data);

    // Validate session structure
    if (!session.sessionId || !session.event_id || !Array.isArray(session.files)) {
      clearUploadState();
      return null;
    }

    return session;
  } catch (e) {
    console.error('Error loading upload state:', e);
    return null;
  }
}

/**
 * Clear current upload state
 */
export function clearUploadState(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Error clearing upload state:', e);
  }
}

/**
 * Get pending files from session
 */
export function getPendingFiles(session: UploadSession): UploadFileState[] {
  return session.files.filter(
    file => file.status === 'queued' || file.status === 'uploading' || file.status === 'paused' || file.status === 'failed'
  );
}

/**
 * Get completed files from session
 */
export function getCompletedFiles(session: UploadSession): UploadFileState[] {
  return session.files.filter(file => file.status === 'completed');
}

/**
 * Update file state in session
 */
export function updateFileState(
  session: UploadSession,
  fileId: string,
  updates: Partial<UploadFileState>
): UploadSession {
  const updatedFiles = session.files.map(file =>
    file.id === fileId ? { ...file, ...updates } : file
  );

  return {
    ...session,
    files: updatedFiles,
    updated_at: Date.now(),
  };
}

/**
 * Remove file from session
 */
export function removeFileFromSession(session: UploadSession, fileId: string): UploadSession {
  return {
    ...session,
    files: session.files.filter(file => file.id !== fileId),
    updated_at: Date.now(),
  };
}

/**
 * Save upload to history
 */
export function saveUploadHistory(session: UploadSession): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const completedFiles = getCompletedFiles(session);
    if (completedFiles.length === 0) {
      return;
    }

    const history: UploadHistory[] = loadUploadHistory();

    const totalSize = completedFiles.reduce((sum, file) => sum + file.file.size, 0);

    const newEntry: UploadHistory = {
      sessionId: session.sessionId,
      event_id: session.event_id,
      completedAt: Date.now(),
      fileCount: completedFiles.length,
      totalSize,
    };

    // Add to beginning and limit size
    history.unshift(newEntry);
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (e) {
    console.error('Error saving upload history:', e);
  }
}

/**
 * Load upload history
 */
export function loadUploadHistory(): UploadHistory[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) {
      return [];
    }

    const history: UploadHistory[] = JSON.parse(data);

    // Filter out old entries
    const maxAge = MAX_HISTORY_AGE_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    return history.filter(entry => now - entry.completedAt < maxAge);
  } catch (e) {
    console.error('Error loading upload history:', e);
    return [];
  }
}

/**
 * Clear upload history
 */
export function clearUploadHistory(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Error clearing upload history:', e);
  }
}

/**
 * Cleanup old sessions and history
 */
export function cleanupOldSessions(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    // Clean up old history entries
    const history = loadUploadHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); // This will auto-filter old entries

    // Check current session age
    const session = loadUploadState();
    if (session) {
      const sessionAge = Date.now() - session.created_at;
      const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge > maxSessionAge && session.status === 'completed') {
        clearUploadState();
      }
    }

    // Remove any orphaned upload keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX) && key !== SESSION_KEY && key !== HISTORY_KEY) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

  } catch (e) {
    console.error('Error cleaning up old sessions:', e);
  }
}

/**
 * Initialize upload session
 */
export function createUploadSession(event_id: string, files: UploadFileState[]): UploadSession {
  return {
    sessionId: generateSessionId(),
    event_id,
    files,
    created_at: Date.now(),
    updated_at: Date.now(),
    status: 'pending',
  };
}

/**
 * Check if session has pending uploads
 */
export function hasPendingUploads(session: UploadSession | null): boolean {
  if (!session) {
    return false;
  }

  return getPendingFiles(session).length > 0;
}
