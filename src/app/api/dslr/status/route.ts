import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to DSLR runtime status file
const DSLR_STATUS_FILE = path.join(process.cwd(), 'dslr-status.json');

// Default status when service is not running
const DEFAULT_STATUS = {
  isConnected: false,
  isProcessing: false,
  totalUploaded: 0,
  failedUploads: 0,
  lastUpload: null,
  watchFolder: process.platform === 'win32' ? 'C:/DCIM/100NIKON' : '/media/DCIM/100NIKON',
  eventId: '',
  uploaderName: 'Official Photographer',
  queueSize: 0,
  uploadSpeed: 0,
  serviceRunning: false,
  lastHeartbeat: null,
  cameraModel: 'Auto-detect',
  autoDetect: true,
  backupEnabled: true,
  notificationsEnabled: true,
  watermarkEnabled: false
};

function readDSLRStatus() {
  // Try to read from file first (for local service updates)
  try {
    if (fs.existsSync(DSLR_STATUS_FILE)) {
      const data = fs.readFileSync(DSLR_STATUS_FILE, 'utf8');
      const status = JSON.parse(data);
      
      // Check if heartbeat is recent (within last 30 seconds)
      const now = new Date().getTime();
      const lastHeartbeat = status.lastHeartbeat ? new Date(status.lastHeartbeat).getTime() : 0;
      const isServiceRunning = (now - lastHeartbeat) < 30000; // 30 seconds
      
      // Merge file status with memory status (memory takes precedence for settings)
      return {
        ...status,
        ...memoryStatus,
        serviceRunning: isServiceRunning,
        isConnected: isServiceRunning && status.isConnected,
        totalUploaded: status.totalUploaded || memoryStatus.totalUploaded,
        failedUploads: status.failedUploads || memoryStatus.failedUploads,
        lastUpload: status.lastUpload || memoryStatus.lastUpload
      };
    }
  } catch (error) {
    console.error('Error reading DSLR status file:', error);
  }
  
  // Fallback to memory status
  return { ...DEFAULT_STATUS, ...memoryStatus };
}

export async function GET() {
  try {
    const dslrStatus = readDSLRStatus();
    
    return NextResponse.json({
      success: true,
      ...dslrStatus
    });
  } catch (error) {
    console.error('Error getting DSLR status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get DSLR status' },
      { status: 500 }
    );
  }
}

// In-memory status storage (since Vercel is read-only)
let memoryStatus = {
  isConnected: false,
  isProcessing: false,
  totalUploaded: 0,
  failedUploads: 0,
  lastUpload: null,
  watchFolder: 'C:/DCIM/100NIKON',
  eventId: '',
  uploaderName: 'Official Photographer',
  queueSize: 0,
  uploadSpeed: 0,
  serviceRunning: false,
  lastHeartbeat: null,
  cameraModel: 'NIKON_D7100',
  autoDetect: true,
  backupEnabled: true,
  notificationsEnabled: true,
  watermarkEnabled: false
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, settings } = body;

    switch (action) {
      case 'pause':
        memoryStatus.isProcessing = false;
        break;
      case 'resume':
        memoryStatus.isProcessing = true;
        break;
      case 'update_settings':
        if (settings) {
          // Update memory status with new settings
          memoryStatus = { 
            ...memoryStatus, 
            ...settings,
            lastHeartbeat: new Date().toISOString()
          };
          
          console.log('✅ DSLR settings updated in memory:', settings);
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...memoryStatus
    });
  } catch (error) {
    console.error('Error updating DSLR status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update DSLR status' },
      { status: 500 }
    );
  }
}

// Note: File writing removed due to Vercel read-only filesystem
// Local service will poll API for settings updates instead