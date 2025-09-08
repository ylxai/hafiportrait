/**
 * Admin Dashboard with Grouped Tabs
 * Mobile-friendly navigation with organized sections
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event, Photo, Stats } from "@/lib/database";
import { apiRequest } from "@/lib/queryClient";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Calendar, 
  Camera, 
  Settings, 
  Bell, 
  Palette,
  Plus,
  Upload,
  TrendingUp,
  Users,
  Activity,
  Monitor,
  Image,
  FolderOpen,
  Trash,
  Play,
  GripVertical,
  Star,
  Crown,
  Trash2
} from "lucide-react";

// Import existing components
import EventList from "@/components/admin/EventList";
import EventForm from "@/components/admin/EventForm";
import StatsCards from "@/components/admin/StatsCards";
import { EventStatusSummary } from "@/components/admin/event-status-summary";
import { AutoStatusManager } from "@/components/admin/auto-status-manager";
import { SmartNotificationManager } from "@/components/admin/smart-notification-manager";
import NotificationManager from "@/components/admin/notification-manager";
import NotificationBell from "@/components/ui/notification-bell";
import { ToastProvider } from "@/components/ui/toast-notification";
import { useToast } from "@/hooks/use-toast";
// removed duplicate Event type import to avoid conflicts
import type { EventFormData } from "@/components/admin/EventForm";

// Dynamic imports for heavy components to avoid circular dependencies
// Import individual monitors
const DSLRMonitor = dynamic(() => import("@/components/admin/dslr-monitor"), {
  ssr: false,
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
});

const SystemMonitor = dynamic(() => import("@/components/admin/system-monitor"), {
  ssr: false,
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
});

const BackupStatusMonitor = dynamic(() => import("@/components/admin/backup-status-monitor").then(mod => ({ default: mod.BackupStatusMonitor })), {
  ssr: false,
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
});

const ColorPaletteProvider = dynamic(() => import("@/components/ui/color-palette-provider").then(mod => mod.ColorPaletteProvider), {
  ssr: false
});

const ColorPaletteSwitcher = dynamic(() => import("@/components/ui/color-palette-switcher").then(mod => mod.ColorPaletteSwitcher), {
  ssr: false,
  loading: () => <div className="w-8 h-8"></div>
});

export default function AdminDashboardGrouped() {
  const auth = useRequireAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // All state hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  
  // Photo management states
  const [selectedPhotoTab, setSelectedPhotoTab] = useState("homepage");
  
  // Slideshow management states
  const [slideshowSettings, setSlideshowSettings] = useState({
    interval: 5,
    transition: 'fade',
    autoplay: true,
    loop: true
  });
  const [selectedEventForPhotos, setSelectedEventForPhotos] = useState("");
  const [isHomepageUploadOpen, setIsHomepageUploadOpen] = useState(false);
  const [isOfficialUploadOpen, setIsOfficialUploadOpen] = useState(false);
  
  // Appearance management states
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Settings management states
  const [websiteSettings, setWebsiteSettings] = useState({
    title: 'HafiPortrait',
    description: 'Professional Photography Services',
    autoUpload: true,
    imageCompression: true,
    compressionQuality: 85,
    maxFileSize: 10,
    watermarkEnabled: false,
    notificationsEnabled: true
  });
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  
  // Preferences management states
  const [userPreferences, setUserPreferences] = useState({
    darkMode: 'auto',
    language: 'id',
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    autoSave: true,
    compactView: false
  });
  const [hasUnsavedPreferences, setHasUnsavedPreferences] = useState(false);

  // All hooks must be called before conditional returns
  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/events");
      return response.json() as Promise<Event[]>;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest("POST", "/api/admin/events", eventData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create event');
      }
      return response.json();
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setCreatedEvent(newEvent); // Store created event for success screen
      setEditingEvent(null);
      toast({
        title: "Event Berhasil Dibuat!",
        description: "Event baru telah ditambahkan ke sistem.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal Membuat Event",
        description: "Terjadi kesalahan saat membuat event.",
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest("PUT", `/api/admin/events/${eventData.id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsEventFormOpen(false);
      setEditingEvent(null);
      toast({
        title: "Event Berhasil Diperbarui!",
        description: "Event telah diperbarui dengan sukses.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal Memperbarui Event",
        description: "Terjadi kesalahan saat memperbarui event.",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/events/${eventId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Event Berhasil Dihapus!",
        description: "Event telah dihapus dari sistem.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal Menghapus Event",
        description: "Terjadi kesalahan saat menghapus event.",
        variant: "destructive",
      });
    },
  });

  // Update event status mutation
  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/events/${eventId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Status Event Berhasil Diubah!",
        description: "Status event telah diperbarui.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal Mengubah Status Event",
        description: "Terjadi kesalahan saat mengubah status event.",
        variant: "destructive",
      });
    },
  });

  // Fetch photos for homepage
  const { data: homepagePhotos = [], isLoading: homepagePhotosLoading } = useQuery<Photo[]>({
    queryKey: ['/api/admin/photos/homepage'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/photos/homepage");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    // cacheTime removed for React Query v5 compatibility
    refetchOnWindowFocus: false,
    enabled: selectedPhotoTab === 'homepage', // Only fetch when tab is active
  });

  // Fetch slideshow photos
  const { data: slideshowPhotos = [], isLoading: slideshowPhotosLoading } = useQuery<Photo[]>({
    queryKey: ['/api/admin/slideshow'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/slideshow");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    // cacheTime removed for React Query v5 compatibility
    refetchOnWindowFocus: false,
    enabled: selectedPhotoTab === 'slideshow', // Only fetch when tab is active
  });

  // Fetch photos for selected event
  const { data: eventPhotos = [], isLoading: eventPhotosLoading } = useQuery<Photo[]>({
    queryKey: ['/api/admin/photos/event', selectedEventForPhotos],
    queryFn: async () => {
      if (!selectedEventForPhotos) return [];
      const response = await apiRequest("GET", `/api/events/${selectedEventForPhotos}/photos`);
      return response.json();
    },
    enabled: !!selectedEventForPhotos && selectedPhotoTab === 'events',
    staleTime: 1 * 60 * 1000, // 1 minute
    // cacheTime removed for React Query v5 compatibility
    refetchOnWindowFocus: false,
  });

  // Add photo to slideshow mutation
  const addToSlideshowMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest('POST', '/api/admin/slideshow', {
        photoId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/slideshow'] });
      toast({
        title: "Berhasil",
        description: "Foto berhasil ditambahkan ke slideshow",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan foto ke slideshow",
        variant: "destructive",
      });
    },
  });

  // Remove photo from slideshow mutation
  const removeFromSlideshowMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/slideshow?photoId=${photoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/slideshow'] });
      toast({
        title: "Berhasil",
        description: "Foto berhasil dihapus dari slideshow",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus foto dari slideshow",
        variant: "destructive",
      });
    },
  });

  // Upload homepage photo mutation
  const uploadHomepagePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest("POST", "/api/admin/photos/homepage", formData);
      return response.json();
    },
    onSuccess: (data, file) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/homepage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsHomepageUploadOpen(false);
      
      // Dispatch notification event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-upload-success', {
          detail: {
            type: 'upload_success',
            data: {
              fileName: file.name,
              eventName: 'Homepage Gallery',
              message: `${file.name} berhasil diupload ke galeri homepage`
            }
          }
        }));
      }
      
      toast({
        title: "Foto Berhasil Diupload!",
        description: "Foto telah ditambahkan ke galeri homepage.",
      });
    },
    onError: (error, file) => {
      // Dispatch notification event for error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-upload-failed', {
          detail: {
            type: 'upload_failed',
            data: {
              fileName: file.name,
              eventName: 'Homepage Gallery',
              message: `Gagal mengupload ${file.name} ke galeri homepage`
            }
          }
        }));
      }
      
      toast({
        title: "Gagal Upload Foto",
        description: "Terjadi kesalahan saat mengupload foto.",
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/photos/${photoId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete photo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/homepage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/event', selectedEventForPhotos] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Foto Berhasil Dihapus!",
        description: "Foto telah dihapus dari sistem.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal Menghapus Foto",
        description: "Terjadi kesalahan saat menghapus foto.",
        variant: "destructive",
      });
    },
  });

  const handleHomepagePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Terlalu Besar",
          description: "Ukuran file maksimal 10MB.",
          variant: "destructive",
        });
        return;
      }
      uploadHomepagePhotoMutation.mutate(file);
    });
  };

  // Upload official photo mutation
  const uploadOfficialPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaderName', 'Admin');
      formData.append('albumName', 'Official');
      const response = await apiRequest("POST", `/api/events/${selectedEventForPhotos}/photos`, formData);
      return response.json();
    },
    onSuccess: (data, file) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/event', selectedEventForPhotos] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsOfficialUploadOpen(false);
      
      // Get event name for notification
      const eventName = events.find(e => e.id === selectedEventForPhotos)?.name || 'Event';
      
      // Dispatch notification event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-upload-success', {
          detail: {
            type: 'upload_success',
            data: {
              fileName: file.name,
              eventName: eventName,
              message: `${file.name} berhasil diupload ke album Official - ${eventName}`
            }
          }
        }));
      }
      
      toast({
        title: "Foto Official Berhasil Diupload!",
        description: "Foto telah ditambahkan ke album Official event.",
      });
    },
    onError: (error, file) => {
      // Get event name for notification
      const eventName = events.find(e => e.id === selectedEventForPhotos)?.name || 'Event';
      
      // Dispatch notification event for error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-upload-failed', {
          detail: {
            type: 'upload_failed',
            data: {
              fileName: file.name,
              eventName: eventName,
              message: `Gagal mengupload ${file.name} ke album Official - ${eventName}`
            }
          }
        }));
      }
      
      toast({
        title: "Gagal Upload Foto Official",
        description: "Terjadi kesalahan saat mengupload foto official.",
        variant: "destructive",
      });
    },
  });

  const handleOfficialPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Terlalu Besar",
          description: "Ukuran file maksimal 10MB.",
          variant: "destructive",
        });
        return;
      }
      uploadOfficialPhotoMutation.mutate(file);
    });
  };

  // Appearance management handlers
  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    setHasUnsavedChanges(true);
  };

  const handleSaveAppearance = () => {
    try {
      // Save theme to localStorage (this is already handled by useColorPalette)
      setHasUnsavedChanges(false);
      toast({
        title: "Tema Berhasil Disimpan! 🎨",
        description: "Perubahan tema telah diterapkan ke seluruh website.",
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan Tema",
        description: "Terjadi kesalahan saat menyimpan tema.",
        variant: "destructive",
      });
    }
  };

  const handleResetTheme = () => {
    if (confirm('Yakin ingin reset tema ke default?')) {
      setCurrentTheme('');
      setHasUnsavedChanges(false);
      // Reset will be handled by the ColorPaletteSwitcher component
      toast({
        title: "Tema Direset! 🔄",
        description: "Tema telah dikembalikan ke pengaturan default.",
      });
    }
  };

  const handleMobilePreview = () => {
    setIsMobilePreviewOpen(true);
  };

  // Settings management handlers
  const handleSettingsChange = (key: string, value: any) => {
    setWebsiteSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedSettings(true);
  };

  const handleSaveSettings = () => {
    try {
      // Save settings to localStorage or API
      localStorage.setItem('hafiportrait-settings', JSON.stringify(websiteSettings));
      setHasUnsavedSettings(false);
      toast({
        title: "Pengaturan Berhasil Disimpan! ⚙️",
        description: "Konfigurasi website telah diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan Pengaturan",
        description: "Terjadi kesalahan saat menyimpan pengaturan.",
        variant: "destructive",
      });
    }
  };

  const handleResetSettings = () => {
    if (confirm('Yakin ingin reset semua pengaturan ke default?')) {
      const defaultSettings = {
        title: 'HafiPortrait',
        description: 'Professional Photography Services',
        autoUpload: true,
        imageCompression: true,
        compressionQuality: 85,
        maxFileSize: 10,
        watermarkEnabled: false,
        notificationsEnabled: true,
        // DSLR specific settings
        dslrAutoUpload: true,
        dslrWatchFolder: 'C:/DCIM/100NIKON',
        dslrCameraModel: 'NIKON_D7100',
        dslrAutoDetect: true,
        dslrBackupEnabled: true,
        dslrNotificationsEnabled: true,
        dslrWatermarkEnabled: false,
        dslrConnectionCheck: 30000
      };
      setWebsiteSettings(defaultSettings);
      setHasUnsavedSettings(false);
      toast({
        title: "Pengaturan Direset! 🔄",
        description: "Semua pengaturan dikembalikan ke default.",
      });
    }
  };

  // Preferences management handlers
  const handlePreferencesChange = (key: string, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedPreferences(true);
  };

  const handleSavePreferences = () => {
    try {
      // Save preferences to localStorage or API
      localStorage.setItem('hafiportrait-preferences', JSON.stringify(userPreferences));
      setHasUnsavedPreferences(false);
      toast({
        title: "Preferensi Berhasil Disimpan! 👤",
        description: "Pengaturan personal Anda telah diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan Preferensi",
        description: "Terjadi kesalahan saat menyimpan preferensi.",
        variant: "destructive",
      });
    }
  };

  const handleResetPreferences = () => {
    if (confirm('Yakin ingin reset semua preferensi ke default?')) {
      const defaultPreferences = {
        darkMode: 'auto',
        language: 'id',
        emailNotifications: true,
        pushNotifications: true,
        twoFactorAuth: false,
        sessionTimeout: 30,
        autoSave: true,
        compactView: false
      };
      setUserPreferences(defaultPreferences);
      setHasUnsavedPreferences(false);
      toast({
        title: "Preferensi Direset! 🔄",
        description: "Semua preferensi dikembalikan ke default.",
      });
    }
  };

  const handleSaveEvent = (data: EventFormData & { id?: string }) => {
    if (editingEvent && editingEvent.id) {
      updateEventMutation.mutate({ ...data, id: editingEvent.id });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const handleStartEdit = (event: Event) => {
    setEditingEvent(event);
    setCreatedEvent(null); // Reset created event when editing
    setIsEventFormOpen(true);
  };
  
  const handleCancelForm = () => {
    setEditingEvent(null);
    setCreatedEvent(null); // Reset created event when canceling
    setIsEventFormOpen(false);
  };

  const handleCreateNewEvent = () => {
    setEditingEvent(null);
    setCreatedEvent(null); // Reset created event when creating new
    setIsEventFormOpen(true);
  };

  const handleStatusChange = (eventId: string, newStatus: string) => {
    // Get current event to track old status
    const currentEvent = events.find(e => e.id === eventId);
    const oldStatus = currentEvent?.status || 'unknown';
    
    updateEventStatusMutation.mutate(
      { eventId, status: newStatus },
      {
        onSuccess: (data) => {
          // Trigger status change notification
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('event-status-changed', {
              detail: {
                eventId,
                eventName: currentEvent?.name || 'Unknown Event',
                oldStatus,
                newStatus,
                timestamp: new Date().toISOString()
              }
            });
            window.dispatchEvent(event);
          }
        }
      }
    );
  };

  const handleRefreshEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
  };
  
  // Conditional returns after all hooks are called
  // Show loading while checking authentication
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will be redirected by useRequireAuth)
  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <ColorPaletteProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Simple Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-xs text-gray-500 hidden sm:block">HafiPortrait Photography</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Notification Bell */}
                  <NotificationBell className="mobile-optimized" />
                  
                  {/* User Info & Logout */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-gray-900">{auth.user?.full_name}</p>
                      <p className="text-xs text-gray-500">@{auth.user?.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {auth.user?.full_name?.charAt(0) || auth.user?.username?.charAt(0)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={auth.logout}
                        className="text-gray-500 hover:text-red-600 px-2 touch-manipulation"
                        title="Logout"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto p-6 pt-4">

            {/* Grouped Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Main Tab Navigation */}
              <TabsList className="grid w-full grid-cols-4 mb-6 h-12">
                <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">📊 Dashboard</span>
                  <span className="sm:hidden">📊</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2 py-3">
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">📸 Content</span>
                  <span className="sm:hidden">📸</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2 py-3">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">🔔 System</span>
                  <span className="sm:hidden">🔔</span>
                </TabsTrigger>
                <TabsTrigger value="customization" className="flex items-center gap-2 py-3">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">🎨 Customize</span>
                  <span className="sm:hidden">🎨</span>
                </TabsTrigger>
              </TabsList>

              {/* DASHBOARD TAB */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Sub-navigation */}
                <div className="border-b">
                  <nav className="flex space-x-8 overflow-x-auto">
                    <SubTabButton
                      active={activeSubTab === 'overview'}
                      onClick={() => setActiveSubTab('overview')}
                      icon="📊"
                      label="Overview"
                    />
                    <SubTabButton
                      active={activeSubTab === 'analytics'}
                      onClick={() => setActiveSubTab('analytics')}
                      icon="📈"
                      label="Analytics"
                    />
                    <SubTabButton
                      active={activeSubTab === 'reports'}
                      onClick={() => setActiveSubTab('reports')}
                      icon="📋"
                      label="Reports"
                    />
                  </nav>
                </div>

                {/* Dashboard Content */}
                {activeSubTab === 'overview' && (
                  <div className="space-y-6">
                    <StatsCards stats={stats} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm">New event created: Wedding Sarah & John</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm">25 photos uploaded via DSLR</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm">Color theme changed to Luxury Wedding</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button 
                            onClick={handleCreateNewEvent}
                            className="w-full bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Event
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photos
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Users className="w-4 h-4 mr-2" />
                            Manage Guests
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeSubTab === 'analytics' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>📈 Analytics Dashboard</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Detailed insights and performance metrics
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-blue-50 rounded-lg">
                          <div className="text-3xl font-bold text-blue-600">1,247</div>
                          <div className="text-sm text-blue-800">Total Photos</div>
                        </div>
                        <div className="text-center p-6 bg-green-50 rounded-lg">
                          <div className="text-3xl font-bold text-green-600">23</div>
                          <div className="text-sm text-green-800">Active Events</div>
                        </div>
                        <div className="text-center p-6 bg-purple-50 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600">89%</div>
                          <div className="text-sm text-purple-800">Satisfaction Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSubTab === 'reports' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>📋 Reports & Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Comprehensive reports and business insights will be displayed here</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="space-y-6">
                {/* Sub-navigation */}
                <div className="border-b">
                  <nav className="flex space-x-8 overflow-x-auto">
                    <SubTabButton
                      active={activeSubTab === 'events'}
                      onClick={() => setActiveSubTab('events')}
                      icon="📅"
                      label="Events"
                    />
                    <SubTabButton
                      active={activeSubTab === 'photos'}
                      onClick={() => setActiveSubTab('photos')}
                      icon="📸"
                      label="Photos"
                    />
                    <SubTabButton
                      active={activeSubTab === 'dslr'}
                      onClick={() => setActiveSubTab('dslr')}
                      icon="📷"
                      label="DSLR"
                    />
                  </nav>
                </div>

                {/* Content based on sub-tab */}
                {activeSubTab === 'events' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-wedding-gold" />
                        Event Management
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Kelola event dan acara photography Anda
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            onClick={handleCreateNewEvent}
                            className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Buat Event Baru
                          </Button>
                          <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Events
                          </Button>
                        </div>

                        {/* Event Status Summary */}
                        <EventStatusSummary events={events} />

                        {/* Auto Status Management */}
                        <AutoStatusManager onRefresh={handleRefreshEvents} />

                        {/* Event Management dengan CRUD */}
                        {eventsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wedding-gold mx-auto"></div>
                            <p className="mt-2 text-gray-600">Memuat events...</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Event Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                                <div className="text-sm text-gray-600">Total Events</div>
                              </div>
                              <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-green-600">
                                  {events.filter(e => new Date(e.date) >= new Date()).length}
                                </div>
                                <div className="text-sm text-gray-600">Upcoming Events</div>
                              </div>
                              <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-purple-600">
                                  {events.filter(e => e.is_premium).length}
                                </div>
                                <div className="text-sm text-gray-600">Premium Events</div>
                              </div>
                            </div>

                            {/* Event List */}
                            <EventList 
                              events={events}
                              onEdit={handleStartEdit}
                              onDelete={(eventId) => deleteEventMutation.mutate(eventId)}
                              onStatusChange={handleStatusChange}
                              onRefresh={handleRefreshEvents}
                              onBackupComplete={(eventId, result) => {
                                // Refresh events to update backup status
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
                              }}
                              onArchiveComplete={(eventId, result) => {
                                // Refresh events to update archive status
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {activeSubTab === 'photos' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-wedding-gold" />
                        Photo Management
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Kelola foto untuk homepage dan event
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={selectedPhotoTab} onValueChange={setSelectedPhotoTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                          <TabsTrigger value="homepage" className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            <span className="hidden sm:inline">Homepage</span>
                            <span className="sm:hidden">Home</span>
                          </TabsTrigger>
                          <TabsTrigger value="slideshow" className="flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">Slideshow</span>
                            <span className="sm:hidden">Slide</span>
                          </TabsTrigger>
                          <TabsTrigger value="events" className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            <span className="hidden sm:inline">Events</span>
                            <span className="sm:hidden">Event</span>
                          </TabsTrigger>
                        </TabsList>

                        {/* Homepage Photos Tab */}
                        <TabsContent value="homepage" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Foto Galeri Homepage</h3>
                            <Button 
                              onClick={() => setIsHomepageUploadOpen(true)} 
                              className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Foto
                            </Button>
                          </div>

                          {/* Upload Modal */}
                          {isHomepageUploadOpen && (
                            <Card className="mb-6 border-wedding-gold/20">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Upload className="w-5 h-5 text-wedding-gold" />
                                  Upload Foto Homepage
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Pilih Foto</label>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleHomepagePhotoUpload}
                                    className="w-full p-2 border rounded-lg mt-1"
                                  />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Ukuran maksimal 10MB per file.
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => setIsHomepageUploadOpen(false)}
                                    variant="outline"
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Loading Indicator */}
                          {uploadHomepagePhotoMutation.isPending && (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wedding-gold"></div>
                              <span className="ml-2 text-sm text-gray-600">Mengupload foto...</span>
                            </div>
                          )}

                          {/* Photo Grid */}
                          {homepagePhotosLoading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wedding-gold mx-auto"></div>
                            </div>
                          ) : homepagePhotos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {homepagePhotos.map((photo: any) => (
                                <div key={photo.id} className="relative group">
                                  <img
                                    src={photo.url}
                                    alt={photo.original_name}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="opacity-0 group-hover:opacity-100"
                                      onClick={() => {
                                        if (confirm('Yakin ingin menghapus foto ini?')) {
                                          deletePhotoMutation.mutate(photo.id);
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
                              <p>Belum ada foto di galeri homepage.</p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Slideshow Photos Tab */}
                        <TabsContent value="slideshow" className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">Hero Slideshow</h3>
                              <p className="text-sm text-muted-foreground">Kelola foto untuk slideshow di homepage</p>
                            </div>
                            <Button 
                              className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                              size="sm"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </div>

                          {/* Mobile-optimized slideshow manager */}
                          <div className="space-y-4">
                            {/* Slideshow photos grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {slideshowPhotosLoading ? (
                                // Loading skeleton
                                Array.from({ length: 4 }).map((_, index) => (
                                  <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                                ))
                              ) : slideshowPhotos.length > 0 ? (
                                // Existing slideshow photos
                                slideshowPhotos.map((photo, index: number) => (
                                  <div key={photo.id} className="relative group aspect-square">
                                    <img
                                      src={photo.url}
                                      alt={photo.original_name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    {/* Order indicator */}
                                    <div className="absolute top-2 left-2 bg-wedding-gold text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                      {index + 1}
                                    </div>
                                    {/* Remove button */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-6 w-6 p-0"
                                        onClick={() => removeFromSlideshowMutation.mutate(photo.id)}
                                        disabled={removeFromSlideshowMutation.isPending}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    {/* Drag handle for reordering */}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <GripVertical className="h-4 w-4 text-white bg-black/50 rounded p-0.5" />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                // Empty state
                                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 col-span-full">
                                  <div className="text-center">
                                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 mb-2">Belum ada foto slideshow</p>
                                    <p className="text-xs text-gray-400">Pilih foto dari galeri homepage di bawah</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Add from gallery section */}
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                Add from Homepage Gallery
                              </h4>
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                {homepagePhotos?.slice(0, 12).map((photo) => {
                                  const isInSlideshow = slideshowPhotos.some((sp) => sp.id === photo.id);
                                  return (
                                    <div 
                                      key={photo.id} 
                                      className={`relative group cursor-pointer ${
                                        isInSlideshow ? 'opacity-50' : ''
                                      }`}
                                      onClick={() => {
                                        if (!isInSlideshow && !addToSlideshowMutation.isPending) {
                                          addToSlideshowMutation.mutate(photo.id);
                                        }
                                      }}
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.original_name}
                                        className="w-full aspect-square object-cover rounded border-2 border-transparent hover:border-wedding-gold transition-colors"
                                      />
                                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                                        {isInSlideshow ? (
                                          <Star className="w-6 h-6 text-wedding-gold" />
                                        ) : (
                                          <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                      </div>
                                      {addToSlideshowMutation.isPending && (
                                        <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Settings */}
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Slideshow Settings
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <label className="block text-gray-600 mb-1">Interval</label>
                                  <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={slideshowSettings.interval}
                                    onChange={(e) => setSlideshowSettings(prev => ({ ...prev, interval: Number(e.target.value) }))}
                                  >
                                    <option value={3}>3 seconds</option>
                                    <option value={5}>5 seconds</option>
                                    <option value={7}>7 seconds</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 mb-1">Transition</label>
                                  <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={slideshowSettings.transition}
                                    onChange={(e) => setSlideshowSettings(prev => ({ ...prev, transition: e.target.value }))}
                                  >
                                    <option value="fade">Fade</option>
                                    <option value="slide">Slide</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 mb-1">Autoplay</label>
                                  <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={slideshowSettings.autoplay.toString()}
                                    onChange={(e) => setSlideshowSettings(prev => ({ ...prev, autoplay: e.target.value === 'true' }))}
                                  >
                                    <option value="true">On</option>
                                    <option value="false">Off</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-600 mb-1">Loop</label>
                                  <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={slideshowSettings.loop.toString()}
                                    onChange={(e) => setSlideshowSettings(prev => ({ ...prev, loop: e.target.value === 'true' }))}
                                  >
                                    <option value="true">On</option>
                                    <option value="false">Off</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Event Photos Tab */}
                        <TabsContent value="events" className="space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                            <h3 className="text-lg font-semibold">Foto Galeri Event</h3>
                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                              <select
                                value={selectedEventForPhotos}
                                onChange={(e) => setSelectedEventForPhotos(e.target.value)}
                                className="px-3 py-2 border rounded-md"
                              >
                                <option value="">Pilih Event</option>
                                {events.map((event: Event) => (
                                  <option key={event.id} value={event.id}>
                                    {event.name}
                                  </option>
                                ))}
                              </select>
                              {selectedEventForPhotos && (
                                <Button
                                  onClick={() => setIsOfficialUploadOpen(true)}
                                  className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  Upload Foto Official
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Official Photo Upload Modal */}
                          {isOfficialUploadOpen && selectedEventForPhotos && (
                            <Card className="mb-6 border-wedding-gold/20">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Crown className="w-5 h-5 text-wedding-gold" />
                                  Upload Foto Official ke Event
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Pilih Foto Official</label>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleOfficialPhotoUpload}
                                    className="w-full p-2 border rounded-lg mt-1"
                                  />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Foto akan diupload ke album "Official" dengan uploader "Admin". Ukuran maksimal 10MB per file.
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => setIsOfficialUploadOpen(false)}
                                    variant="outline"
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Loading Indicator for Official Upload */}
                          {uploadOfficialPhotoMutation.isPending && (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wedding-gold"></div>
                              <span className="ml-2 text-sm text-gray-600">Mengupload foto official...</span>
                            </div>
                          )}

                          {selectedEventForPhotos ? (
                            eventPhotosLoading ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wedding-gold mx-auto"></div>
                              </div>
                            ) : eventPhotos.length > 0 ? (
                              <div>
                                {/* Group photos by album */}
                                {["Official", "Tamu", "Bridesmaid"].map(albumName => { 
                                  const albumPhotos = eventPhotos.filter((photo) => photo.album_name === albumName);
                                  if (albumPhotos.length === 0) return null;
                                  
                                  return (
                                    <div key={albumName} className="mb-8">
                                      <h4 className="text-md font-semibold mb-4 text-wedding-gold flex items-center gap-2">
                                        {albumName === "Official" && <Crown className="w-4 h-4" />}
                                        Album {albumName} ({albumPhotos.length} foto)
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {albumPhotos.map((photo: any) => (
                                          <div key={photo.id} className="relative group">
                                            <img
                                              src={photo.url}
                                              alt={photo.original_name}
                                              className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/50 rounded px-1 py-0.5 truncate">
                                              {photo.uploader_name || 'Anonim'}
                                            </div>
                                            {/* Delete button for all photos (admin can delete any photo) */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center">
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                className="opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const albumText = albumName === "Official" ? "foto official" : `foto dari album ${albumName}`;
                                                  if (confirm(`Yakin ingin menghapus ${albumText} ini?`)) {
                                                    deletePhotoMutation.mutate(photo.id);
                                                  }
                                                }}
                                              >
                                                <Trash className="w-3 h-3" />
                                              </Button>
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
                                <p>Belum ada foto di event ini.</p>
                              </div>
                            )
                          ) : (
                            <div className="text-center py-12 text-gray-500">
                              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>Pilih event untuk melihat foto-fotonya.</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
                {activeSubTab === 'dslr' && <DSLRMonitor />}
              </TabsContent>

              {/* SYSTEM TAB */}
              <TabsContent value="system" className="space-y-6">
                {/* Sub-navigation - Mobile Optimized */}
                <div className="border-b">
                  <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-2">
                    <SubTabButton
                      active={activeSubTab === 'notifications'}
                      onClick={() => setActiveSubTab('notifications')}
                      icon="🔔"
                      label="Notifications"
                    />
                    <SubTabButton
                      active={activeSubTab === 'monitoring'}
                      onClick={() => setActiveSubTab('monitoring')}
                      icon="📊"
                      label="Monitoring"
                    />
                    <SubTabButton
                      active={activeSubTab === 'backup'}
                      onClick={() => setActiveSubTab('backup')}
                      icon="💾"
                      label="Backup"
                    />
                  </nav>
                </div>

                {/* System Content */}
                {activeSubTab === 'notifications' && <NotificationManager />}
                {activeSubTab === 'monitoring' && <SystemMonitor />}
                {activeSubTab === 'backup' && (
                  <div className="space-y-6">
                    {/* Mobile-Optimized Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-blue-900 flex items-center gap-2">
                            💾 Backup Management
                          </h2>
                          <p className="text-sm text-blue-700 mt-1">
                            Monitor dan kelola backup event ke Google Drive
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm">
                          <div className="bg-white/80 rounded-lg px-3 py-2 text-center">
                            <div className="font-semibold text-green-600">15GB+</div>
                            <div className="text-gray-600">Google Drive</div>
                          </div>
                          <div className="bg-white/80 rounded-lg px-3 py-2 text-center">
                            <div className="font-semibold text-blue-600">FREE</div>
                            <div className="text-gray-600">Storage</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* BackupStatusMonitor Component */}
                    <BackupStatusMonitor />
                  </div>
                )}
              </TabsContent>

              {/* CUSTOMIZATION TAB */}
              <TabsContent value="customization" className="space-y-6">
                {/* Sub-navigation */}
                <div className="border-b">
                  <nav className="flex space-x-8 overflow-x-auto">
                    <SubTabButton
                      active={activeSubTab === 'appearance'}
                      onClick={() => setActiveSubTab('appearance')}
                      icon="🎨"
                      label="Appearance"
                    />
                    <SubTabButton
                      active={activeSubTab === 'settings'}
                      onClick={() => setActiveSubTab('settings')}
                      icon="⚙️"
                      label="Settings"
                    />
                    <SubTabButton
                      active={activeSubTab === 'preferences'}
                      onClick={() => setActiveSubTab('preferences')}
                      icon="🔧"
                      label="Preferences"
                    />
                  </nav>
                </div>

                {/* Customization Content */}
                {activeSubTab === 'appearance' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-wedding-gold" />
                        Website Appearance
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Kelola tampilan dan tema warna website HafiPortrait
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Color Palette Section */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">Color Theme</h3>
                          <p className="text-sm text-muted-foreground">
                            Pilih tema warna yang sesuai dengan brand dan event Anda
                          </p>
                        </div>
                        
                        {/* Inline Color Palette Selector */}
                        <div className="border rounded-lg p-6 bg-gray-50">
                          <ColorPaletteSwitcher 
                            variant="inline" 
                            showLabel={false}
                            onPaletteChange={handleThemeChange}
                          />
                        </div>
                        
                        {/* Color Palette Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">💡 Tips Pemilihan Tema:</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>🏆 Luxury Wedding</strong> - Terbaik untuk photography business</li>
                            <li>• <strong>Elegant Photography</strong> - Professional dan timeless</li>
                            <li>• <strong>Champagne Gold</strong> - Perfect untuk celebration events</li>
                            <li>• <strong>Rose Gold Premium</strong> - Ideal untuk feminine events</li>
                            <li>• <strong>Vintage Sepia</strong> - Classic photography feel</li>
                          </ul>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button 
                          onClick={handleSaveAppearance}
                          className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                          disabled={!hasUnsavedChanges}
                        >
                          💾 Save Changes
                          {hasUnsavedChanges && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleResetTheme}
                        >
                          🔄 Reset to Default
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleMobilePreview}
                        >
                          📱 Preview on Mobile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSubTab === 'settings' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-wedding-gold" />
                        General Settings
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Konfigurasi umum aplikasi dan sistem
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Website Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Website Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Website Title</label>
                            <input 
                              type="text" 
                              value={websiteSettings.title}
                              onChange={(e) => handleSettingsChange('title', e.target.value)}
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-wedding-gold focus:border-transparent"
                              placeholder="Nama website Anda"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Website Description</label>
                            <input 
                              type="text" 
                              value={websiteSettings.description}
                              onChange={(e) => handleSettingsChange('description', e.target.value)}
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-wedding-gold focus:border-transparent"
                              placeholder="Deskripsi singkat website"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Upload Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Upload Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Auto Upload</p>
                              <p className="text-sm text-muted-foreground">
                                Otomatis upload foto dari DSLR
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={websiteSettings.autoUpload}
                                onChange={(e) => handleSettingsChange('autoUpload', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Image Compression</p>
                              <p className="text-sm text-muted-foreground">
                                Kompres foto untuk menghemat storage
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={websiteSettings.imageCompression}
                                onChange={(e) => handleSettingsChange('imageCompression', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Advanced Upload Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Compression Quality (%)</label>
                            <div className="space-y-2">
                              <input
                                type="range"
                                min="50"
                                max="100"
                                value={websiteSettings.compressionQuality}
                                onChange={(e) => handleSettingsChange('compressionQuality', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                disabled={!websiteSettings.imageCompression}
                              />
                              <div className="text-center text-sm text-gray-600">
                                {websiteSettings.compressionQuality}%
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Max File Size (MB)</label>
                            <select
                              value={websiteSettings.maxFileSize}
                              onChange={(e) => handleSettingsChange('maxFileSize', parseInt(e.target.value))}
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-wedding-gold focus:border-transparent"
                            >
                              <option value={5}>5 MB</option>
                              <option value={10}>10 MB</option>
                              <option value={20}>20 MB</option>
                              <option value={50}>50 MB</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Watermark</label>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="text-sm">Enable Watermark</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={websiteSettings.watermarkEnabled}
                                  onChange={(e) => handleSettingsChange('watermarkEnabled', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Notification Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Notification Settings</h3>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                          <div>
                            <p className="font-medium">System Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Notifikasi upload, error, dan sistem lainnya
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={websiteSettings.notificationsEnabled}
                              onChange={(e) => handleSettingsChange('notificationsEnabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                          </label>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button 
                          onClick={handleSaveSettings}
                          className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                          disabled={!hasUnsavedSettings}
                        >
                          💾 Save Settings
                          {hasUnsavedSettings && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleResetSettings}
                        >
                          🔄 Reset to Default
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Settings Exported! 📤",
                              description: "Pengaturan telah disalin ke clipboard.",
                            });
                            navigator.clipboard.writeText(JSON.stringify(websiteSettings, null, 2));
                          }}
                        >
                          📤 Export Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSubTab === 'preferences' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-wedding-gold" />
                        User Preferences
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Personalisasi pengalaman pengguna Anda
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Display Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Display Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Dark Mode</p>
                              <p className="text-sm text-muted-foreground">
                                Gunakan tema gelap untuk admin dashboard
                              </p>
                            </div>
                            <select
                              value={userPreferences.darkMode}
                              onChange={(e) => handlePreferencesChange('darkMode', e.target.value)}
                              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-wedding-gold focus:border-transparent"
                            >
                              <option value="auto">🌓 Auto</option>
                              <option value="light">☀️ Light</option>
                              <option value="dark">🌙 Dark</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Language</p>
                              <p className="text-sm text-muted-foreground">
                                Bahasa interface admin dashboard
                              </p>
                            </div>
                            <select
                              value={userPreferences.language}
                              onChange={(e) => handlePreferencesChange('language', e.target.value)}
                              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-wedding-gold focus:border-transparent"
                            >
                              <option value="id">🇮🇩 Bahasa Indonesia</option>
                              <option value="en">🇺🇸 English</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Compact View</p>
                              <p className="text-sm text-muted-foreground">
                                Tampilan lebih padat untuk layar kecil
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userPreferences.compactView}
                                onChange={(e) => handlePreferencesChange('compactView', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Notification Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Notification Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-muted-foreground">
                                Terima notifikasi via email
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userPreferences.emailNotifications}
                                onChange={(e) => handlePreferencesChange('emailNotifications', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Push Notifications</p>
                              <p className="text-sm text-muted-foreground">
                                Notifikasi real-time di browser
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userPreferences.pushNotifications}
                                onChange={(e) => handlePreferencesChange('pushNotifications', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Auto Save</p>
                              <p className="text-sm text-muted-foreground">
                                Simpan perubahan secara otomatis
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userPreferences.autoSave}
                                onChange={(e) => handlePreferencesChange('autoSave', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Privacy & Security */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Privacy & Security</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Two-Factor Authentication</p>
                              <p className="text-sm text-muted-foreground">
                                Keamanan tambahan untuk login
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={userPreferences.twoFactorAuth}
                                  onChange={(e) => handlePreferencesChange('twoFactorAuth', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wedding-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-gold"></div>
                              </label>
                              {userPreferences.twoFactorAuth && (
                                <Button variant="outline" size="sm">
                                  🔧 Setup
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                              <p className="font-medium">Session Timeout</p>
                              <p className="text-sm text-muted-foreground">
                                Auto logout setelah tidak aktif
                              </p>
                            </div>
                            <select
                              value={userPreferences.sessionTimeout}
                              onChange={(e) => handlePreferencesChange('sessionTimeout', parseInt(e.target.value))}
                              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-wedding-gold focus:border-transparent"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                              <option value={0}>Never</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button 
                          onClick={handleSavePreferences}
                          className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                          disabled={!hasUnsavedPreferences}
                        >
                          💾 Save Preferences
                          {hasUnsavedPreferences && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleResetPreferences}
                        >
                          🔄 Reset to Default
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Preferences Exported! 📤",
                              description: "Preferensi telah disalin ke clipboard.",
                            });
                            navigator.clipboard.writeText(JSON.stringify(userPreferences, null, 2));
                          }}
                        >
                          📤 Export Preferences
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Event Form Modal */}
          {isEventFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <EventForm 
                  editingEvent={editingEvent}
                  onSave={handleSaveEvent}
                  onCancel={handleCancelForm}
                  isSaving={createEventMutation.isPending || updateEventMutation.isPending}
                  createdEvent={createdEvent}
                />
              </div>
            </div>
          )}

          {/* Mobile Preview Modal */}
          {isMobilePreviewOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">📱 Mobile Preview</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobilePreviewOpen(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="p-4">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '9/16' }}>
                      <iframe
                        src={typeof window !== 'undefined' ? window.location.origin : '/'}
                        className="w-full h-full border-0"
                        title="Mobile Preview"
                        style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: '125%' }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Preview website dengan tema yang dipilih
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.open(window.location.origin, '_blank');
                          }
                        }}
                      >
                        🔗 Open in New Tab
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMobilePreviewOpen(false)}
                      >
                        ✅ Done
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ToastProvider>
    </ColorPaletteProvider>
  );
}

// Sub-tab button component
function SubTabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string; 
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
        active
          ? 'border-wedding-gold text-wedding-gold'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon} {label}
    </button>
  );
}