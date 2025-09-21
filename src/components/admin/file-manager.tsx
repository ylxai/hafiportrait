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

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [currentPath]);

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
      setFiles(data.files || []);
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

      toast({
        title: 'Success',
        description: `${selectedFiles.size} files deleted successfully`
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
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedFiles(new Set([file.id]));
                        deleteSelectedFiles();
                      }}
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
    </Card>
  );
}