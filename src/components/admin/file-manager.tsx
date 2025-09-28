'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  File, 
  Folder, 
  Trash2, 
  Download, 
  Move, 
  RefreshCw,
  Filter,
  FileText,
  Image,
  Archive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  modified: string;
  path: string;
  extension?: string;
  isSelected: boolean;
  metadata?: {
    eventId?: string;
    eventName?: string;
    albumName?: string;
    uploadedBy?: string;
  };
}

interface FileManagerProps {
  className?: string;
}

export function FileManager({ className = '' }: FileManagerProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'archives'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTargetFile, setMoveTargetFile] = useState<string | null>(null);
  const [availableAlbums, setAvailableAlbums] = useState<string[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
    loadMoveOptions();
  }, [currentPath]);

  // Load move options (albums and events)
  const loadMoveOptions = async () => {
    try {
      const response = await fetch('/api/admin/photos/move');
      if (response.ok) {
        const data = await response.json();
        setAvailableAlbums(data.data?.albums || []);
        setAvailableEvents(data.data?.events || []);
      }
    } catch (error) {
      console.error('Error loading move options:', error);
    }
  };

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath })
      });

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      // Handle API response structure - files are in data.files
      setFiles(data.data?.files || data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, toast]);

  // Filter files based on search and type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    
    const extension = file.extension?.toLowerCase();
    switch (filterType) {
      case 'images':
        return matchesSearch && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension || '');
      case 'documents':
        return matchesSearch && ['pdf', 'doc', 'docx', 'txt', 'csv'].includes(extension || '');
      case 'archives':
        return matchesSearch && ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '');
      default:
        return matchesSearch;
    }
  });

  // Select/deselect files
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  // Bulk delete selected files
  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;

    if (!confirm(`Delete ${selectedFiles.size} selected files? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/files/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) })
      });

      if (!response.ok) {
        throw new Error('Failed to delete files');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `${result.data?.deletedCount || selectedFiles.size} files deleted successfully`
      });

      setSelectedFiles(new Set());
      await loadFiles();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete files',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete single file
  const deleteSingleFile = async (fileId: string) => {
    if (!confirm('Delete this file? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      toast({
        title: 'Success',
        description: 'File deleted successfully'
      });

      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download single file
  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/admin/files/${fileId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const result = await response.json();
      
      if (result.success && result.data?.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = result.data.filename || filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Success',
          description: 'Download started'
        });
      } else {
        throw new Error('No download URL provided');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive'
      });
    }
  };

  // Move file functionality
  const moveFile = async (fileId: string, targetAlbum: string, targetEvent?: string) => {
    try {
      const response = await fetch('/api/admin/photos/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: [fileId],
          targetAlbum,
          targetEvent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to move file');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `File moved successfully to ${targetAlbum}`
      });

      await loadFiles();
    } catch (error) {
      console.error('Error moving file:', error);
      toast({
        title: 'Error',
        description: 'Failed to move file',
        variant: 'destructive'
      });
    }
  };

  // Show move dialog
  const showMoveDialogForFile = (fileId: string) => {
    setMoveTargetFile(fileId);
    setShowMoveDialog(true);
  };

  // Handle move dialog submit
  const handleMoveSubmit = async (targetAlbum: string, targetEvent?: string) => {
    if (!moveTargetFile) return;
    
    await moveFile(moveTargetFile, targetAlbum, targetEvent);
    setShowMoveDialog(false);
    setMoveTargetFile(null);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="h-5 w-5 text-blue-500" />;
    
    const extension = file.extension?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-green-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive className="h-5 w-5 text-orange-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            File Manager
          </CardTitle>
          <Button 
            onClick={loadFiles} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="archives">Archives</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">
              {selectedFiles.size} files selected
            </span>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={deleteSelectedFiles}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 p-2 border-b">
            <Checkbox
              checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
              onCheckedChange={selectAllFiles}
            />
            <span className="text-sm font-medium">
              Select All ({filteredFiles.length} files)
            </span>
          </div>

          {/* Files List */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No files found</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={() => toggleFileSelection(file.id)}
                  />
                  
                  {getFileIcon(file)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{file.name}</span>
                      {file.metadata?.eventName && (
                        <Badge variant="secondary" className="text-xs">
                          {file.metadata.eventName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{new Date(file.modified).toLocaleDateString()}</span>
                      {file.metadata?.albumName && (
                        <span>📁 {file.metadata.albumName}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => downloadFile(file.id, file.name)}
                      disabled={isLoading}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => showMoveDialogForFile(file.id)}
                      disabled={isLoading || file.id.startsWith('local-')}
                      title={file.id.startsWith('local-') ? 'Cannot move local backup files' : 'Move file'}
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteSingleFile(file.id)}
                      disabled={isLoading}
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Move Dialog */}
      <MoveFileDialog
        isOpen={showMoveDialog}
        onClose={() => {
          setShowMoveDialog(false);
          setMoveTargetFile(null);
        }}
        onSubmit={handleMoveSubmit}
        availableAlbums={availableAlbums}
        availableEvents={availableEvents}
        currentFile={moveTargetFile ? files.find(f => f.id === moveTargetFile) : null}
      />
    </Card>
  );
}

// Move File Dialog Component
interface MoveFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (targetAlbum: string, targetEvent?: string) => void;
  availableAlbums: string[];
  availableEvents: any[];
  currentFile: FileItem | null | undefined;
}

function MoveFileDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  availableAlbums, 
  availableEvents, 
  currentFile 
}: MoveFileDialogProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  const handleSubmit = () => {
    if (!selectedAlbum) {
      alert('Please select an album');
      return;
    }
    onSubmit(selectedAlbum, selectedEvent || undefined);
  };

  if (!currentFile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Moving: <strong>{currentFile.name}</strong>
            </p>
            {currentFile.metadata?.eventName && (
              <p className="text-xs text-gray-500">
                Current event: {currentFile.metadata.eventName}
              </p>
            )}
            {currentFile.metadata?.albumName && (
              <p className="text-xs text-gray-500">
                Current album: {currentFile.metadata.albumName}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Target Album</label>
            <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
              <SelectTrigger>
                <SelectValue placeholder="Select album" />
              </SelectTrigger>
              <SelectContent>
                {availableAlbums.map(album => (
                  <SelectItem key={album} value={album}>
                    {album}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Target Event (Optional)</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current event or select new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep current event</SelectItem>
                {availableEvents.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedAlbum}>
              Move File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}