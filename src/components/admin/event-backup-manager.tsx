'use client';

/**
 * Event Backup Manager Component
 * Provides interface for backing up and archiving events
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Archive, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Database
} from 'lucide-react';

interface BackupStatus {
  backupId: string;
  eventId: string;
  status: 'initializing' | 'backing_up' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalPhotos: number;
  processedPhotos: number;
  successfulUploads: number;
  failedUploads: number;
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
  duration?: number;
  errors?: Array<{ photoId: string; error: string }>;
}

interface EventBackupManagerProps {
  eventId: string;
  eventName: string;
  isArchived?: boolean;
  onBackupComplete?: (result: any) => void;
  onArchiveComplete?: (result: any) => void;
}

export function EventBackupManager({ 
  eventId, 
  eventName, 
  isArchived = false,
  onBackupComplete,
  onArchiveComplete 
}: EventBackupManagerProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [archiveInfo, setArchiveInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial archive status
  useEffect(() => {
    loadArchiveStatus();
  }, [eventId]);

  // Poll backup status when backing up
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBackingUp && backupStatus?.backupId) {
      // Enhanced adaptive polling for backup progress
      const getBackupPollingInterval = () => {
        if (!backupStatus) return 5000;
        
        // More frequent polling during critical phases
        switch (backupStatus.status) {
          case 'initializing':
            return 1000; // 1s during initialization
          case 'backing_up':
            // Adaptive based on progress - faster when starting/ending
            const progress = backupStatus.totalPhotos > 0 ? 
              (backupStatus.processedPhotos / backupStatus.totalPhotos) : 0;
            
            if (progress < 0.1 || progress > 0.9) {
              return 1500; // 1.5s during start/end phases
            } else {
              return 2500; // 2.5s during middle phase
            }
          case 'completed':
          case 'failed':
            return 10000; // 10s for final status (will stop anyway)
          default:
            return 3000; // 3s default
        }
      };
      
      const pollingInterval = getBackupPollingInterval();
      interval = setInterval(() => {
        pollBackupStatus(backupStatus.backupId);
      }, pollingInterval);
      
      console.log(`📊 Event Backup Manager polling: ${pollingInterval}ms (Status: ${backupStatus?.status}, Progress: ${backupStatus ? Math.round((backupStatus.processedPhotos / backupStatus.totalPhotos) * 100) : 0}%)`);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBackingUp, backupStatus?.backupId]);

  const loadArchiveStatus = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/archive`);
      const result = await response.json();
      
      if (result.success) {
        setArchiveInfo(result.data);
      }
    } catch (error) {
      console.error('Failed to load archive status:', error);
    }
  };

  const startBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compressionQuality: 0.90,
          includeMetadata: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setBackupStatus(result.data);
        setSuccess(`Backup started successfully! Backup ID: ${result.data.backupId}`);
        
        // Continue polling until completion
        pollBackupStatus(result.data.backupId);
        
        if (onBackupComplete) {
          onBackupComplete(result.data);
        }
      } else {
        throw new Error(result.message || 'Backup failed');
      }
    } catch (error: any) {
      setError(`Backup failed: ${error.message}`);
      setIsBackingUp(false);
    }
  };

  const pollBackupStatus = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/backup?backupId=${backupId}`);
      const result = await response.json();
      
      if (result.success) {
        setBackupStatus(result.data);
        
        // Stop polling if completed or failed
        if (result.data.status === 'completed' || result.data.status === 'failed') {
          setIsBackingUp(false);
          
          if (result.data.status === 'completed') {
            setSuccess(`Backup completed! ${result.data.successfulUploads}/${result.data.totalPhotos} photos backed up successfully.`);
          } else {
            setError(`Backup failed: ${result.data.error || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll backup status:', error);
    }
  };

  const archiveEvent = async () => {
    if (!backupStatus?.backupId) {
      setError('Cannot archive: No completed backup found');
      return;
    }
    
    setIsArchiving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupId: backupStatus.backupId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setArchiveInfo(result.data);
        setSuccess('Event archived successfully!');
        
        if (onArchiveComplete) {
          onArchiveComplete(result.data);
        }
      } else {
        throw new Error(result.message || 'Archive failed');
      }
    } catch (error: any) {
      setError(`Archive failed: ${error.message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  const unarchiveEvent = async () => {
    setIsArchiving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/archive`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setArchiveInfo({ ...archiveInfo, isArchived: false });
        setSuccess('Event unarchived successfully!');
      } else {
        throw new Error(result.message || 'Unarchive failed');
      }
    } catch (error: any) {
      setError(`Unarchive failed: ${error.message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'backing_up':
      case 'initializing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'failed': 'destructive',
      'backing_up': 'secondary',
      'initializing': 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (!backupStatus || backupStatus.totalPhotos === 0) return 0;
    return Math.round((backupStatus.processedPhotos / backupStatus.totalPhotos) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Event Backup & Archive Manager
        </CardTitle>
        <CardDescription>
          Backup event photos to Google Drive and manage archive status for: <strong>{eventName}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Archive Status */}
        {archiveInfo && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archive Status
            </h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant={archiveInfo.isArchived ? "default" : "outline"}>
                  {archiveInfo.isArchived ? "ARCHIVED" : "ACTIVE"}
                </Badge>
                {archiveInfo.archivedAt && (
                  <span className="text-sm text-gray-600">
                    Archived: {new Date(archiveInfo.archivedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {archiveInfo.googleDriveBackupUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(archiveInfo.googleDriveBackupUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View in Google Drive
                </Button>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Backup Section */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" />
            Backup to Google Drive
          </h4>
          
          {/* Backup Status */}
          {backupStatus && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Backup Progress</span>
                {getStatusBadge(backupStatus.status)}
              </div>
              
              {backupStatus.status === 'backing_up' && (
                <div className="space-y-2">
                  <Progress value={calculateProgress()} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{backupStatus.processedPhotos} / {backupStatus.totalPhotos} photos</span>
                    <span>{calculateProgress()}% complete</span>
                  </div>
                </div>
              )}
              
              {backupStatus.status === 'completed' && (
                <div className="text-sm space-y-1">
                  <div className="text-green-600 font-medium">
                    ✅ Backup completed successfully!
                  </div>
                  <div>📊 {backupStatus.successfulUploads} photos backed up</div>
                  {backupStatus.failedUploads > 0 && (
                    <div className="text-orange-600">
                      ⚠️ {backupStatus.failedUploads} photos failed
                    </div>
                  )}
                  {backupStatus.duration && (
                    <div>⏱️ Duration: {Math.round(backupStatus.duration / 1000)}s</div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Backup Actions */}
          <div className="flex gap-2">
            <Button
              onClick={startBackup}
              disabled={isBackingUp || archiveInfo?.isArchived}
              className="flex items-center gap-2"
            >
              {isBackingUp ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isBackingUp ? 'Backing Up...' : 'Start Backup'}
            </Button>
            
            {backupStatus?.status === 'completed' && !archiveInfo?.isArchived && (
              <Button
                variant="outline"
                onClick={archiveEvent}
                disabled={isArchiving}
                className="flex items-center gap-2"
              >
                {isArchiving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                {isArchiving ? 'Archiving...' : 'Archive Event'}
              </Button>
            )}
            
            {archiveInfo?.isArchived && (
              <Button
                variant="outline"
                onClick={unarchiveEvent}
                disabled={isArchiving}
                className="flex items-center gap-2"
              >
                {isArchiving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                {isArchiving ? 'Unarchiving...' : 'Unarchive Event'}
              </Button>
            )}
          </div>
        </div>

        {/* Backup Info */}
        <div className="text-sm text-gray-600 space-y-1">
          <div>💾 Backup destination: Google Drive (15GB+ free storage)</div>
          <div>🔒 High-quality compression (90%) for archival purposes</div>
          <div>📁 Organized in event-specific folders</div>
          <div>🌐 Publicly accessible backup links</div>
        </div>
      </CardContent>
    </Card>
  );
}