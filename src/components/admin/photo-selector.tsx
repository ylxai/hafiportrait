'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar,
  User,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { PhotoBulkActions } from './photo-bulk-actions';

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
  storage_tier?: string;
  storage_provider?: string;
}

interface PhotoSelectorProps {
  eventId?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size' | 'uploader';
type SortOrder = 'asc' | 'desc';

export function PhotoSelector({ eventId, className = '' }: PhotoSelectorProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [albumFilter, setAlbumFilter] = useState<string>('all');
  const [uploaderFilter, setUploaderFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Load photos
  useEffect(() => {
    loadPhotos();
  }, [eventId]);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const url = eventId 
        ? `/api/events/${eventId}/photos`
        : '/api/admin/photos';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load photos');
      }

      const data = await response.json();
      console.log('📸 PhotoSelector API Response:', data);
      
      // Handle different response structures
      let photosArray = [];
      if (Array.isArray(data)) {
        photosArray = data;
      } else if (data.success && data.data && Array.isArray(data.data.photos)) {
        photosArray = data.data.photos;
      } else if (data.photos && Array.isArray(data.photos)) {
        photosArray = data.photos;
      } else {
        console.warn('Unexpected API response structure:', data);
        photosArray = [];
      }
      
      console.log(`📸 Setting ${photosArray.length} photos in PhotoSelector`);
      setPhotos(photosArray);
    } catch (error) {
      console.error('Error loading photos:', error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort photos
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = photos.filter(photo => {
      const matchesSearch = 
        photo.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.uploader_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAlbum = albumFilter === 'all' || photo.album_name === albumFilter;
      const matchesUploader = uploaderFilter === 'all' || photo.uploader_name === uploaderFilter;
      
      return matchesSearch && matchesAlbum && matchesUploader;
    });

    // Sort photos
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'name':
          aVal = a.original_name.toLowerCase();
          bVal = b.original_name.toLowerCase();
          break;
        case 'size':
          aVal = a.file_size;
          bVal = b.file_size;
          break;
        case 'uploader':
          aVal = a.uploader_name.toLowerCase();
          bVal = b.uploader_name.toLowerCase();
          break;
        case 'date':
        default:
          aVal = new Date(a.uploaded_at).getTime();
          bVal = new Date(b.uploaded_at).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [photos, searchQuery, albumFilter, uploaderFilter, sortBy, sortOrder]);

  // Get unique values for filters
  const uniqueAlbums = Array.from(new Set(photos.map(p => p.album_name)));
  const uniqueUploaders = Array.from(new Set(photos.map(p => p.uploader_name)));

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId);
      } else {
        newSelection.add(photoId);
      }
      return newSelection;
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Photo Bulk Actions */}
      <PhotoBulkActions
        selectedPhotos={selectedPhotos}
        allPhotos={filteredAndSortedPhotos}
        onSelectionChange={setSelectedPhotos}
        onPhotosUpdated={loadPhotos}
      />

      {/* Photo Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photo Manager
              <Badge variant="secondary">
                {filteredAndSortedPhotos.length} photos
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadPhotos}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search photos by name or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={albumFilter}
                onChange={(e) => setAlbumFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="all">All Albums</option>
                {uniqueAlbums.map(album => (
                  <option key={album} value={album}>{album}</option>
                ))}
              </select>

              <select
                value={uploaderFilter}
                onChange={(e) => setUploaderFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="all">All Uploaders</option>
                {uniqueUploaders.map(uploader => (
                  <option key={uploader} value={uploader}>{uploader}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="uploader">Sort by Uploader</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading photos...</p>
            </div>
          ) : filteredAndSortedPhotos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No photos found</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAndSortedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhotos.has(photo.id) 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => togglePhotoSelection(photo.id)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.original_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedPhotos.has(photo.id)}
                        onChange={() => togglePhotoSelection(photo.id)}
                        className="bg-white/90 border-white"
                      />
                    </div>

                    {/* Photo Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs space-y-1">
                        <div className="font-medium truncate">{photo.original_name}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <FolderOpen className="h-3 w-3" />
                          {photo.album_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3" />
                          {photo.uploader_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredAndSortedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedPhotos.has(photo.id) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => togglePhotoSelection(photo.id)}
                >
                  <Checkbox
                    checked={selectedPhotos.has(photo.id)}
                    onChange={() => togglePhotoSelection(photo.id)}
                  />
                  
                  <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.original_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{photo.original_name}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {photo.album_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {photo.uploader_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(photo.uploaded_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatFileSize(photo.file_size)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}