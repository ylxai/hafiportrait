'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Trash2, 
  Move, 
  Archive,
  CheckSquare,
  Square,
  Loader2,
  FolderOpen,
  Image
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  original_name: string;
  album_name: string;
  event_id: string;
  event_name?: string;
  file_size: number;
  uploaded_at: string;
  uploader_name: string;
}

interface PhotoBulkActionsProps {
  selectedPhotos: Set<string>;
  allPhotos: PhotoItem[];
  onSelectionChange: (photoIds: Set<string>) => void;
  onPhotosUpdated: () => void;
  className?: string;
}

export function PhotoBulkActions({
  selectedPhotos,
  allPhotos,
  onSelectionChange,
  onPhotosUpdated,
  className = ''
}: PhotoBulkActionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const selectedPhotosList = allPhotos.filter(photo => selectedPhotos.has(photo.id));
  const totalSelectedSize = selectedPhotosList.reduce((sum, photo) => sum + photo.file_size, 0);

  // Select all photos
  const selectAllPhotos = () => {
    if (selectedPhotos.size === allPhotos.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allPhotos.map(p => p.id)));
    }
  };

  // Select photos by album
  const selectByAlbum = (albumName: string) => {
    const albumPhotos = allPhotos.filter(p => p.album_name === albumName);
    const albumPhotoIds = albumPhotos.map(p => p.id);
    const newSelection = new Set(selectedPhotos);
    
    // Toggle album selection
    const allAlbumSelected = albumPhotoIds.every(id => selectedPhotos.has(id));
    if (allAlbumSelected) {
      albumPhotoIds.forEach(id => newSelection.delete(id));
    } else {
      albumPhotoIds.forEach(id => newSelection.add(id));
    }
    
    onSelectionChange(newSelection);
  };

  // Bulk delete photos
  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedPhotos.size} selected photos? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/files/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileIds: Array.from(selectedPhotos)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete photos');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `${result.data?.deletedCount || selectedPhotos.size} photos deleted successfully`
      });

      onSelectionChange(new Set());
      onPhotosUpdated();
    } catch (error) {
      console.error('Error deleting photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download selected photos as ZIP
  const downloadAsZip = async () => {
    if (selectedPhotos.size === 0) return;

    setIsLoading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch('/api/admin/photos/bulk/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoIds: Array.from(selectedPhotos),
          includeOriginals: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate ZIP');
      }

      // Get the ZIP file as blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photos-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `ZIP file with ${selectedPhotos.size} photos downloaded`
      });

    } catch (error) {
      console.error('Error downloading ZIP:', error);
      toast({
        title: 'Error',
        description: 'Failed to download ZIP file',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setDownloadProgress(0);
    }
  };

  // Archive selected photos
  const archiveSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;

    const confirmed = window.confirm(
      `Archive ${selectedPhotos.size} selected photos? They will be hidden from gallery but not deleted.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/photos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoIds: Array.from(selectedPhotos),
          action: 'archive'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to archive photos');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `${result.data.archivedCount} photos archived successfully`
      });

      onSelectionChange(new Set());
      onPhotosUpdated();
    } catch (error) {
      console.error('Error archiving photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive photos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Move photos to different album
  const movePhotos = async (targetAlbum: string) => {
    if (selectedPhotos.size === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/photos/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoIds: Array.from(selectedPhotos),
          targetAlbum: targetAlbum
        })
      });

      if (!response.ok) {
        throw new Error('Failed to move photos');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `${result.data.movedCount} photos moved to ${targetAlbum}`
      });

      onSelectionChange(new Set());
      onPhotosUpdated();
    } catch (error) {
      console.error('Error moving photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to move photos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get unique albums
  const uniqueAlbums = Array.from(new Set(allPhotos.map(p => p.album_name)));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Bulk Photo Actions
          {selectedPhotos.size > 0 && (
            <Badge variant="secondary">
              {selectedPhotos.size} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection Tools */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllPhotos}
              className="flex items-center gap-2"
            >
              {selectedPhotos.size === allPhotos.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedPhotos.size === allPhotos.length ? 'Deselect All' : 'Select All'}
              ({allPhotos.length})
            </Button>
          </div>

          {/* Select by Album */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Select by Album:</span>
            {uniqueAlbums.map(album => {
              const albumPhotos = allPhotos.filter(p => p.album_name === album);
              const selectedInAlbum = albumPhotos.filter(p => selectedPhotos.has(p.id)).length;
              const allSelected = selectedInAlbum === albumPhotos.length;
              
              return (
                <Button
                  key={album}
                  variant={allSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectByAlbum(album)}
                  className="text-xs"
                >
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {album} ({selectedInAlbum}/{albumPhotos.length})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Selection Summary */}
        {selectedPhotos.size > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            {/* Main Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900 text-lg">
                      {selectedPhotos.size} photos selected
                    </span>
                    <div className="text-sm text-blue-700">
                      Total size: {formatFileSize(totalSelectedSize)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Clear */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSelectionChange(new Set())}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </Button>
            </div>
            
            {/* Enhanced Album Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Selection by Album:
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uniqueAlbums.map(album => {
                  const albumPhotos = selectedPhotosList.filter(p => p.album_name === album);
                  const count = albumPhotos.length;
                  if (count === 0) return null;
                  
                  const albumSize = albumPhotos.reduce((sum, photo) => sum + photo.file_size, 0);
                  const percentage = ((count / selectedPhotos.size) * 100).toFixed(0);
                  
                  return (
                    <div 
                      key={album} 
                      className="bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-800 text-sm">{album}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {percentage}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{count} photos</span>
                          <span>{formatFileSize(albumSize)}</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Bulk Actions */}
        {selectedPhotos.size > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-600" />
              Bulk Actions
            </h4>
            
            <div className="space-y-4">
              {/* Primary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={downloadAsZip}
                  disabled={isLoading}
                  className="h-12 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                  size="lg"
                >
                  {isLoading && downloadProgress > 0 ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generating ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Download ZIP ({selectedPhotos.size} photos)</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={archiveSelectedPhotos}
                  disabled={isLoading}
                  className="h-12 flex items-center justify-center gap-2 border-orange-300 hover:bg-orange-50"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-5 w-5 text-orange-600" />
                      <span>Archive Selected</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={deleteSelectedPhotos}
                  disabled={isLoading}
                  className="h-12 flex items-center justify-center gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>Delete Selected</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Move to Album Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Move className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-700">Move to Album:</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['Official', 'Tamu', 'Bridesmaid'].map(album => {
                    const currentInAlbum = selectedPhotosList.filter(p => p.album_name === album).length;
                    const willMove = selectedPhotosList.filter(p => p.album_name !== album).length;
                    
                    return (
                      <Button
                        key={album}
                        variant="outline"
                        onClick={() => movePhotos(album)}
                        disabled={isLoading || willMove === 0}
                        className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-4 w-4" />
                          <span className="font-medium">{album}</span>
                        </div>
                        {currentInAlbum > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {currentInAlbum} already here
                          </Badge>
                        )}
                        {willMove > 0 && (
                          <div className="text-xs text-green-600">
                            Move {willMove} photos
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                {selectedPhotosList.every(p => ['Official', 'Tamu', 'Bridesmaid'].includes(p.album_name)) && (
                  <div className="mt-3 text-center text-sm text-gray-500">
                    All selected photos are already in standard albums
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Progress */}
        {isLoading && downloadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating ZIP...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}