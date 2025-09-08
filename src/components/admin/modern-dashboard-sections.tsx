'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Camera, 
  MessageSquare, 
  TrendingUp,
  Users,
  Activity,
  Plus,
  Edit,
  QrCode,
  Trash,
  Play,
  Pause,
  CheckCircle,
  Image,
  Monitor,
  Settings
} from "lucide-react";
import { ResponsiveGrid, MobileCard } from "./responsive-grid";
import { MobileDataTable } from "./mobile-data-table";
import { QuickActionButtons } from "./quick-action-buttons";
import { SlideshowPanel } from "./slideshow-panel";
import StatsCards from "./StatsCards";
import { EventStatusSummary } from "./event-status-summary";
import { AutoStatusManager } from "./auto-status-manager";
import EventForm from "./EventForm";
import EventList from "./EventList";
import dynamic from 'next/dynamic';

// Dynamic imports
const SystemMonitor = dynamic(() => import("./system-monitor"), { ssr: false });
const DSLRMonitor = dynamic(() => import("./dslr-monitor"), { ssr: false });
const BackupStatusMonitor = dynamic(() => import("./backup-status-monitor").then(mod => ({ default: mod.BackupStatusMonitor })), { ssr: false });
const SmartNotificationManager = dynamic(() => import("./smart-notification-manager").then(mod => ({ default: mod.SmartNotificationManager })), { ssr: false });
const ColorPaletteSwitcher = dynamic(() => import("../ui/color-palette-switcher").then(mod => mod.ColorPaletteSwitcher), { ssr: false });
const PricingPackagesManager = dynamic(() => import("./pricing-packages-manager"), { ssr: false });
const AlertDashboard = dynamic(() => import("./alert-dashboard").then(mod => ({ default: mod.AlertDashboard })), { ssr: false });
const RealTimeMonitor = dynamic(() => import("./real-time-monitor").then(mod => ({ default: mod.RealTimeMonitor })), { ssr: false });

interface DashboardSectionProps {
  stats?: any;
  events?: any[];
  onCreateEvent?: () => void;
  onEditEvent?: (event: any) => void;
  onDeleteEvent?: (eventId: string) => void;
  onShowQRCode?: (event: any) => void;
  onUpdateEventStatus?: (eventId: string, status: string) => void;
  onRefresh?: () => void;
}

// Dashboard Overview
export function DashboardSection({ stats, events = [] }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 md:p-6 text-white">
        <h1 className="text-lg md:text-2xl font-bold mb-2">Selamat Datang di Admin Dashboard</h1>
        <p className="text-sm md:text-base text-blue-100">Kelola event dan galeri foto HafiPortrait Photography</p>
      </div>

      {/* Quick Stats */}
      <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
        <MobileCard
          title="Total Event"
          value={stats?.totalEvents || 0}
          icon={<Calendar className="h-5 w-5" />}
          subtitle="Event aktif & selesai"
          trend="+12%"
        />
        <MobileCard
          title="Total Foto"
          value={stats?.totalPhotos || 0}
          icon={<Camera className="h-5 w-5" />}
          subtitle="Semua galeri"
          trend="+8%"
        />
        <MobileCard
          title="Total Pesan"
          value={stats?.totalMessages || 0}
          icon={<MessageSquare className="h-5 w-5" />}
          subtitle="Dari pengunjung"
          trend="+15%"
        />
        <MobileCard
          title="Pengunjung"
          value="2.4K"
          icon={<Users className="h-5 w-5" />}
          subtitle="Bulan ini"
          trend="+23%"
        />
      </ResponsiveGrid>

      {/* Event Status Overview */}
      <ResponsiveGrid columns={{ mobile: 2, tablet: 4, desktop: 4 }}>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'active').length}
            </div>
            <div className="text-sm text-green-700">Event Aktif</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-sm text-blue-700">Event Selesai</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {events.filter(e => e.status === 'draft').length}
            </div>
            <div className="text-sm text-yellow-700">Draft</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {events.filter(e => e.is_archived).length}
            </div>
            <div className="text-sm text-purple-700">Diarsip</div>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      {/* Quick Actions */}
      <QuickActionButtons 
        onCreateEvent={() => {}}
        onUploadPhoto={() => {}}
        onViewAnalytics={() => {}}
        onSystemCheck={() => {}}
      />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Event Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.status === 'active' ? 'bg-green-500' : 
                    event.status === 'completed' ? 'bg-blue-500' : 
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Events List Section
export function EventsListSection({ 
  events = [], 
  onCreateEvent,
  onEditEvent, 
  onDeleteEvent, 
  onShowQRCode, 
  onUpdateEventStatus,
  onRefresh 
}: DashboardSectionProps) {
  console.log('EventsListSection props:', { onCreateEvent, events: events.length });
  
  const handleBackupComplete = (eventId: string, result: any) => {
    console.log('Backup completed for event:', eventId, result);
  };

  const handleArchiveComplete = (eventId: string, result: any) => {
    console.log('Archive completed for event:', eventId, result);
  };

  const handleStatusChange = (eventId: string, newStatus: string) => {
    if (onUpdateEventStatus) {
      onUpdateEventStatus(eventId, newStatus);
    }
  };

  const handleRefresh = () => {
    // Use the onRefresh prop passed from parent component
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Daftar Event</h1>
        <Button onClick={() => onCreateEvent?.()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Event Baru</span>
          <span className="sm:hidden">Buat Event</span>
        </Button>
      </div>

      <StatsCards stats={{ totalEvents: events.length }} />
      <EventStatusSummary events={events} />

      {/* Use EventList component with backup and status management */}
      <EventList
        events={events}
        onEdit={onEditEvent || (() => {})}
        onDelete={onDeleteEvent || (() => {})}
        onBackupComplete={handleBackupComplete}
        onArchiveComplete={handleArchiveComplete}
        onStatusChange={handleStatusChange}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

// Media Sections
export function MediaHomepageSection({ 
  homepagePhotos = [], 
  isLoading = false, 
  onUpload, 
  onDelete,
  onPhotoClick 
}: {
  homepagePhotos?: any[];
  isLoading?: boolean;
  onUpload?: (files: FileList) => void;
  onDelete?: (photoId: string) => void;
  onPhotoClick?: (index: number) => void;
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onUpload) {
      onUpload(files);
      setIsUploadOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Galeri Homepage</h1>
        <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Upload Foto</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Upload Foto Homepage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="homepage-photo-input">Pilih Foto</Label>
              <Input
                id="homepage-photo-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Ukuran maksimal 10MB per file. Format: JPG, PNG, GIF
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setIsUploadOpen(false)} variant="outline" className="w-full sm:w-auto">
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Memuat foto...</p>
            </div>
          ) : homepagePhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {homepagePhotos.map((photo: any, index: number) => (
                <div 
                  key={photo.id} 
                  className="relative group cursor-pointer"
                  onClick={() => onPhotoClick?.(index)}
                >
                  <img
                    src={photo.url}
                    alt={photo.original_name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Yakin ingin menghapus foto ini?')) {
                          onDelete?.(photo.id);
                        }
                      }}
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada foto di galeri homepage. Upload foto pertama Anda!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MediaSlideshowSection({
  slideshowPhotos = [],
  homepagePhotos = [],
  isLoading = false,
  onAddToSlideshow,
  onRemoveFromSlideshow,
  isAddingToSlideshow = false,
  isPanelOpen = false,
  onPanelToggle
}: {
  slideshowPhotos?: any[];
  homepagePhotos?: any[];
  isLoading?: boolean;
  onAddToSlideshow?: (photoId: string) => void;
  onRemoveFromSlideshow?: (photoId: string) => void;
  isAddingToSlideshow?: boolean;
  isPanelOpen?: boolean;
  onPanelToggle?: (open: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Hero Slideshow</h1>
          <p className="text-sm md:text-base text-gray-600">Kelola foto untuk slideshow di homepage</p>
        </div>
        <Button 
          onClick={() => onPanelToggle?.(true)}
          className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
        >
          <Settings className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Kelola Slideshow</span>
          <span className="sm:hidden">Kelola</span>
        </Button>
      </div>

      {/* Current Slideshow Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Foto Slideshow Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : slideshowPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {slideshowPhotos.map((photo: any, index: number) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.original_name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveFromSlideshow?.(photo.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm text-gray-500 mb-2">Belum ada foto slideshow</p>
              <p className="text-xs text-gray-400">Pilih foto dari galeri homepage di bawah</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Tentang Hero Slideshow</h4>
              <p className="text-sm text-blue-700 mt-1">
                Foto-foto ini akan ditampilkan sebagai slideshow di halaman utama website. 
                Urutan foto akan sesuai dengan urutan yang ditampilkan di atas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slide-out Panel */}
      <SlideshowPanel
        isOpen={isPanelOpen}
        onClose={() => onPanelToggle?.(false)}
        slideshowPhotos={slideshowPhotos}
        homepagePhotos={homepagePhotos}
        onAddToSlideshow={onAddToSlideshow}
        onRemoveFromSlideshow={onRemoveFromSlideshow}
        isAddingToSlideshow={isAddingToSlideshow}
      />
    </div>
  );
}

export function MediaEventsSection({
  events = [],
  eventPhotos = [],
  selectedEventForPhotos = "",
  isLoading = false,
  onEventSelect,
  onPhotoUpload,
  onPhotoClick,
  onPhotoDelete
}: {
  events?: any[];
  eventPhotos?: any[];
  selectedEventForPhotos?: string;
  isLoading?: boolean;
  onEventSelect?: (eventId: string) => void;
  onPhotoUpload?: (file: File, albumName: string) => void;
  onPhotoClick?: (index: number, albumPhotos: any[]) => void;
  onPhotoDelete?: (photoId: string) => void;
}) {
  const [selectedAlbum, setSelectedAlbum] = useState("Official");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert(`${invalidFiles.length} file(s) melebihi ukuran maksimal 10MB dan akan dilewati.`);
    }

    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    if (validFiles.length === 0) {
      alert("Tidak ada file yang valid untuk diupload.");
      return;
    }

    setIsUploading(true);
    
    // Upload files one by one with progress tracking
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileKey = `${file.name}-${i}`;
      
      try {
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: 0
        }));

        // Simulate progress (in real implementation, you'd get this from upload API)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: Math.min((prev[fileKey] || 0) + 20, 90)
          }));
        }, 200);

        // Upload file
        await onPhotoUpload?.(file, selectedAlbum);
        
        // Complete progress
        clearInterval(progressInterval);
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: 100
        }));

        // Small delay between uploads to prevent overwhelming the server
        if (i < validFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: -1 // Error state
        }));
      }
    }

    // Clean up and close modal after a short delay
    setTimeout(() => {
      setUploadProgress({});
      setIsUploading(false);
      setIsUploadOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Foto Event</h1>
          <p className="text-sm md:text-base text-gray-600">Upload dan kelola foto untuk event tertentu</p>
        </div>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="event-select">Event</Label>
              <select
                id="event-select"
                value={selectedEventForPhotos}
                onChange={(e) => onEventSelect?.(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Pilih Event</option>
                {events.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString('id-ID')}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedEventForPhotos && (
              <div className="flex gap-2">
                <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Upload Foto</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {isUploadOpen && selectedEventForPhotos && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Upload Foto Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="album-select">Album</Label>
              <select
                id="album-select"
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mt-1"
              >
                <option value="Official">Official</option>
                <option value="Tamu">Tamu</option>
                <option value="Bridesmaid">Bridesmaid</option>
              </select>
            </div>
            <div>
              <Label htmlFor="event-photo-input">Pilih Foto</Label>
              <Input
                id="event-photo-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="mt-1"
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Ukuran maksimal 10MB per file. Format: JPG, PNG, GIF. Bisa pilih multiple files.
              </p>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-2">
                <Label>Progress Upload:</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {Object.entries(uploadProgress).map(([fileKey, progress]) => {
                    const fileName = fileKey.split('-').slice(0, -1).join('-');
                    return (
                      <div key={fileKey} className="flex items-center gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{fileName}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress === -1 ? 'bg-red-500' : 
                                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.max(0, progress)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 min-w-0">
                          {progress === -1 ? 'Error' : 
                           progress === 100 ? 'Done' : `${progress}%`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setIsUploadOpen(false)} 
                variant="outline"
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? 'Uploading...' : 'Batal'}
              </Button>
              {isUploading && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Mengupload foto...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Photos Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedEventForPhotos ? 
              `Foto Event: ${events.find(e => e.id === selectedEventForPhotos)?.name || 'Unknown'}` : 
              'Foto Event'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedEventForPhotos ? (
            <div className="text-center py-12 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Pilih event untuk melihat dan mengelola foto-fotonya</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Memuat foto...</p>
            </div>
          ) : eventPhotos.length > 0 ? (
            <div className="space-y-6">
              {["Official", "Tamu", "Bridesmaid"].map(albumName => {
                const albumPhotos = eventPhotos.filter((photo: any) => photo.album_name === albumName);
                if (albumPhotos.length === 0) return null;
                
                return (
                  <div key={albumName}>
                    <h4 className="text-lg font-semibold mb-4 text-blue-600 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Album {albumName} ({albumPhotos.length} foto)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {albumPhotos.map((photo: any, index: number) => (
                        <div 
                          key={photo.id} 
                          className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                          onClick={() => onPhotoClick?.(index, albumPhotos)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.original_name}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                                {photo.uploader_name || 'Admin'}
                              </div>
                            </div>
                            {/* Delete Button */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Yakin ingin menghapus foto ini secara permanen?')) {
                                    onPhotoDelete?.(photo.id);
                                  }
                                }}
                              >
                                <Trash className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada foto di event ini</p>
              <Button 
                onClick={() => setIsUploadOpen(true)}
                className="mt-4 w-full sm:w-auto"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Upload Foto Pertama</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// System Sections
export function SystemMonitorSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">System Monitor</h1>
        <p className="text-sm md:text-base text-gray-600">Comprehensive system monitoring with real-time metrics, health checks, performance analysis, DSLR status, and security monitoring</p>
      </div>
      <RealTimeMonitor />
    </div>
  );
}

export function SystemRealTimeMonitorSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Real-time System Monitor</h1>
      <p className="text-gray-600">Monitor sistem secara real-time dengan metrics lengkap</p>
      <RealTimeMonitor />
    </div>
  );
}

export function SystemAlertDashboardSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Alert Management</h1>
        <p className="text-sm md:text-base text-gray-600">Kelola alerts dan notifikasi sistem</p>
      </div>
      <AlertDashboard />
    </div>
  );
}

export function SystemAdvancedMonitoringSection() {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Advanced Monitoring</h1>
          <p className="text-sm md:text-base text-gray-600">Monitoring sistem lengkap dengan real-time metrics dan alert management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === 'realtime' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('realtime')}
            className="w-full sm:w-auto"
          >
            <Activity className="h-4 w-4 mr-2" />
            Real-time
          </Button>
          <Button
            variant={activeTab === 'alerts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('alerts')}
            className="w-full sm:w-auto"
          >
            <Monitor className="h-4 w-4 mr-2" />
            Alerts
          </Button>
        </div>
      </div>

      {activeTab === 'realtime' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span>Real-time System Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RealTimeMonitor />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-red-500" />
                <span>Alert Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDashboard />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export function SystemDSLRSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">DSLR Monitor</h1>
      <DSLRMonitor />
    </div>
  );
}

export function SystemBackupSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Backup Status</h1>
      <BackupStatusMonitor />
    </div>
  );
}

export function SystemNotificationsSection({ events = [] }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
      <SmartNotificationManager events={events} />
    </div>
  );
}

// Settings Sections
export function SettingsThemeSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Tema & Tampilan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium">Pilih Tema Warna</p>
              <p className="text-sm text-gray-500">Ubah skema warna website</p>
            </div>
            <div className="w-full sm:w-auto">
              <ColorPaletteSwitcher />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsProfileSection({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Profile Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Lengkap</label>
              <p className="text-gray-600">{user?.full_name || 'Admin'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-gray-600">{user?.email || 'admin@hafiportrait.com'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsPricingSection() {
  return (
    <div className="space-y-6">
      <PricingPackagesManager />
    </div>
  );
}

export function EventsCreateSection({ 
  onCreateEvent,
  onEventSubmit,
  isCreating = false,
  onCancel
}: DashboardSectionProps & {
  onEventSubmit?: (eventData: any) => void;
  isCreating?: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Buat Event Baru</h1>
          <p className="text-sm md:text-base text-gray-600">Tambahkan event photography baru</p>
        </div>
        <Button 
          onClick={() => onCancel?.()}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Kembali ke Daftar</span>
          <span className="sm:hidden">Kembali</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Form Event Baru</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EventForm
            editingEvent={null}
            createdEvent={null}
            isSaving={isCreating}
            onSave={(eventData) => onEventSubmit?.(eventData)}
            onCancel={() => onCancel?.()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function EventsStatusSection({ events = [] }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Status Manager</h1>
      <EventStatusSummary events={events} />
      <AutoStatusManager events={events} />
    </div>
  );
}