'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRequireAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Event, Stats } from "@/lib/database";

// Import modern components
import { ModernAdminLayout } from "@/components/admin/modern-admin-layout";
import { 
  DashboardSection,
  EventsListSection,
  EventsCreateSection,
  EventsStatusSection,
  MediaHomepageSection,
  MediaSlideshowSection,
  MediaEventsSection,
  SystemMonitorSection,
  SystemAlertDashboardSection,
  SystemAdvancedMonitoringSection,
  SystemDSLRSection,
  SystemBackupSection,
  SystemNotificationsSection,
  SettingsThemeSection,
  SettingsPricingSection,
  SettingsProfileSection
} from "@/components/admin/modern-dashboard-sections";

// Import existing components for functionality
import { QRCodeDialog } from "@/components/admin/qr-code-dialog";
import EventForm from "@/components/admin/EventForm";
import { ToastProvider } from "@/components/ui/toast-notification";
import PhotoLightbox from "@/components/photo-lightbox";

export default function ModernAdminDashboard() {
  const auth = useRequireAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management - MOVED BEFORE CONDITIONAL RETURNS
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedEventForQR, setSelectedEventForQR] = useState<Event | null>(null);
  
  // Photo management states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isSlideshowPanelOpen, setIsSlideshowPanelOpen] = useState(false);
  
  // Event photo lightbox states
  const [isEventLightboxOpen, setIsEventLightboxOpen] = useState(false);
  const [selectedEventPhotoIndex, setSelectedEventPhotoIndex] = useState<number | null>(null);
  const [selectedEventPhotosForLightbox, setSelectedEventPhotosForLightbox] = useState<any[]>([]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/events");
      return response.json() as Promise<Event[]>;
    },
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch photos for homepage
  const { data: homepagePhotos = [], isLoading: homepagePhotosLoading } = useQuery({
    queryKey: ['/api/admin/photos/homepage'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/photos/homepage");
      return response.json();
    },
  });

  // Fetch slideshow photos
  const { data: slideshowPhotos = [], isLoading: slideshowPhotosLoading } = useQuery({
    queryKey: ['/api/admin/slideshow'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/slideshow");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Event photos state
  const [selectedEventForPhotos, setSelectedEventForPhotos] = useState("");

  // Fetch photos for selected event
  const { data: eventPhotos = [], isLoading: eventPhotosLoading } = useQuery({
    queryKey: ['/api/admin/photos/event', selectedEventForPhotos],
    queryFn: async () => {
      if (!selectedEventForPhotos) return [];
      const response = await apiRequest("GET", `/api/events/${selectedEventForPhotos}/photos`);
      return response.json();
    },
    enabled: !!selectedEventForPhotos,
  });

  // Create/Update event mutations
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest("POST", "/api/admin/events", eventData);
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: (newEvent: Event) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setCreatedEvent(newEvent);
      setIsEventFormOpen(false);
      
      // Show success notification
      toast({
        title: "✅ Event Berhasil Dibuat!",
        description: `Event "${newEvent.name}" telah ditambahkan.`,
      });
      
      // Show QR Code modal after creation
      setSelectedEventForQR(newEvent);
      setIsQRDialogOpen(true);
      
      // Navigate back to events list
      setActiveSection('events-list');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: any }) => {
      const response = await apiRequest("PUT", `/api/admin/events/${eventId}`, eventData);
      if (!response.ok) throw new Error('Failed to update event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsEventFormOpen(false);
      setEditingEvent(null);
      toast({
        title: "✅ Event Berhasil Diupdate!",
        description: "Perubahan telah disimpan.",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to delete event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "✅ Event Berhasil Dihapus!",
        description: "Event telah dihapus dari sistem.",
      });
    },
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/events/${eventId}/status`, { status });
      if (!response.ok) throw new Error('Failed to update event status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      toast({
        title: "✅ Status Event Diupdate!",
        description: "Status event berhasil diubah.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/homepage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "✅ Foto Berhasil Diupload!",
        description: "Foto telah ditambahkan ke galeri homepage.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Upload Foto",
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "✅ Foto Berhasil Dihapus!",
        description: "Foto telah dihapus dari sistem.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Menghapus Foto",
        description: "Terjadi kesalahan saat menghapus foto.",
        variant: "destructive",
      });
    },
  });

  // Add photo to slideshow mutation
  const addToSlideshowMutation = useMutation({
    mutationFn: async (photoId: string) => {
      console.log('Adding photo to slideshow:', photoId);
      
      const response = await apiRequest('POST', '/api/admin/slideshow', {
        photoId: photoId
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to add photo to slideshow');
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Successfully added to slideshow:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/slideshow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/homepage'] });
      toast({
        title: "✅ Berhasil!",
        description: "Foto berhasil ditambahkan ke slideshow",
      });
    },
    onError: (error: any) => {
      console.error('Error adding to slideshow:', error);
      toast({
        title: "❌ Gagal",
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
        title: "✅ Berhasil!",
        description: "Foto berhasil dihapus dari slideshow",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Gagal",
        description: error.message || "Gagal menghapus foto dari slideshow",
        variant: "destructive",
      });
    },
  });

  // Delete event photo mutation
  const deleteEventPhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/photos/event/${photoId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Delete failed' }));
        throw new Error(errorData.message || 'Delete failed');
      }
      return response.json();
    },
    onSuccess: (data, photoId) => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/event', selectedEventForPhotos] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Invalidate event page queries for immediate real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventForPhotos, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventForPhotos] });
      
      // Force immediate refetch for event page
      queryClient.refetchQueries({ queryKey: ['/api/events', selectedEventForPhotos, 'photos'] });
      
      // Broadcast event for immediate update across tabs
      window.dispatchEvent(new CustomEvent('photoDeleted', { 
        detail: { eventId: selectedEventForPhotos, photoId } 
      }));
      
      toast({
        title: "✅ Foto Event Berhasil Dihapus!",
        description: "Foto telah dihapus dari galeri event.",
      });
    },
    onError: (error: any, photoId) => {
      // Revert lightbox state if delete failed
      queryClient.refetchQueries({ queryKey: ['/api/admin/photos/event', selectedEventForPhotos] });
      
      toast({
        title: "❌ Gagal Menghapus Foto Event",
        description: `Gagal menghapus foto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Upload event photo mutation
  const uploadEventPhotoMutation = useMutation({
    mutationFn: async ({ file, albumName }: { file: File; albumName: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaderName', 'Admin');
      formData.append('albumName', albumName);
      const response = await apiRequest("POST", `/api/events/${selectedEventForPhotos}/photos`, formData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos/event', selectedEventForPhotos] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Invalidate event page queries for immediate real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventForPhotos, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventForPhotos] });
      
      // Force immediate refetch for event page
      queryClient.refetchQueries({ queryKey: ['/api/events', selectedEventForPhotos, 'photos'] });
      
      // Broadcast event for immediate update across tabs
      window.dispatchEvent(new CustomEvent('photoUploaded', { 
        detail: { eventId: selectedEventForPhotos, fileName: variables.file.name } 
      }));
      
      toast({
        title: "✅ Foto Event Berhasil Diupload!",
        description: `Foto "${variables.file.name}" telah ditambahkan ke album ${variables.albumName}.`,
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "❌ Gagal Upload Foto Event",
        description: `Gagal mengupload "${variables.file.name}": ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCreateNewEvent = () => {
    setEditingEvent(null);
    setCreatedEvent(null);
    setIsEventFormOpen(true);
  };

  const handleCreateNewEventSection = () => {
    setActiveSection('events-create');
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setCreatedEvent(null);
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (confirm(`Yakin ingin menghapus event "${event?.name}"? Semua foto dan pesan akan ikut terhapus.`)) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleShowQRCode = (event: Event) => {
    setSelectedEventForQR(event);
    setIsQRDialogOpen(true);
  };

  const handleEventSubmit = async (eventData: any) => {
    if (editingEvent) {
      updateEventMutation.mutate({ eventId: editingEvent.id, eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  // Photo management handlers
  const handleHomepagePhotoUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
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

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const handleEventPhotoClick = (index: number, albumPhotos: any[]) => {
    // Validate input data
    if (!albumPhotos || albumPhotos.length === 0 || index < 0 || index >= albumPhotos.length) {
      console.warn('Invalid photo data for lightbox:', { index, albumPhotosLength: albumPhotos?.length });
      return;
    }
    
    // Filter out any invalid photos
    const validPhotos = albumPhotos.filter(photo => photo && photo.id && photo.url);
    
    if (validPhotos.length === 0) {
      console.warn('No valid photos found for lightbox');
      return;
    }
    
    // Adjust index if needed after filtering
    const adjustedIndex = Math.min(index, validPhotos.length - 1);
    
    setSelectedEventPhotosForLightbox(validPhotos);
    setSelectedEventPhotoIndex(adjustedIndex);
    setIsEventLightboxOpen(true);
  };

  // Refresh function
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
  };

  // Section props
  const sectionProps = {
    stats,
    events,
    onCreateEvent: handleCreateNewEventSection,
    onEditEvent: handleEditEvent,
    onDeleteEvent: handleDeleteEvent,
    onShowQRCode: handleShowQRCode,
    onUpdateEventStatus: (eventId: string, status: string) => 
      updateEventStatusMutation.mutate({ eventId, status }),
    onEventSubmit: handleEventSubmit,
    isCreating: createEventMutation.isPending,
    onCancel: () => setActiveSection('events-list'),
    onRefresh: handleRefresh
  };

  // Media section props
  const mediaSectionProps = {
    homepagePhotos,
    isLoading: homepagePhotosLoading,
    onUpload: handleHomepagePhotoUpload,
    onDelete: (photoId: string) => deletePhotoMutation.mutate(photoId),
    onPhotoClick: handlePhotoClick
  };

  // Slideshow section props
  const slideshowSectionProps = {
    slideshowPhotos,
    homepagePhotos,
    isLoading: slideshowPhotosLoading,
    onAddToSlideshow: (photoId: string) => addToSlideshowMutation.mutate(photoId),
    onRemoveFromSlideshow: (photoId: string) => removeFromSlideshowMutation.mutate(photoId),
    isAddingToSlideshow: addToSlideshowMutation.isPending,
    isPanelOpen: isSlideshowPanelOpen,
    onPanelToggle: setIsSlideshowPanelOpen
  };

  // Event photos section props
  const eventPhotosSectionProps = {
    events,
    eventPhotos,
    selectedEventForPhotos,
    isLoading: eventPhotosLoading,
    onEventSelect: setSelectedEventForPhotos,
    onPhotoUpload: (file: File, albumName: string) => 
      uploadEventPhotoMutation.mutate({ file, albumName }),
    onPhotoClick: handleEventPhotoClick,
    onPhotoDelete: (photoId: string) => deleteEventPhotoMutation.mutate(photoId)
  };

  // Render current section
  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection {...sectionProps} />;
      case 'events-list':
        return <EventsListSection {...sectionProps} />;
      case 'events-create':
        return <EventsCreateSection {...sectionProps} />;
      case 'events-status':
        return <EventsStatusSection {...sectionProps} />;
      case 'media-homepage':
        return <MediaHomepageSection {...mediaSectionProps} />;
      case 'media-slideshow':
        return <MediaSlideshowSection {...slideshowSectionProps} />;
      case 'media-events':
        return <MediaEventsSection {...eventPhotosSectionProps} />;
      case 'system-monitor':
        return <SystemMonitorSection />;
      case 'system-alerts':
        return <SystemAlertDashboardSection />;
      case 'system-advanced':
        return <SystemAdvancedMonitoringSection />;
      case 'system-dslr':
        return <SystemDSLRSection />;
      case 'system-backup':
        return <SystemBackupSection />;
      case 'system-notifications':
        return <SystemNotificationsSection {...sectionProps} />;
      case 'settings-theme':
        return <SettingsThemeSection />;
      case 'settings-pricing':
        return <SettingsPricingSection />;
      case 'settings-profile':
        return <SettingsProfileSection user={auth.user} />;
      default:
        return <DashboardSection {...sectionProps} />;
    }
  };

  // Show loading spinner while auth is being checked
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Loading state for user
  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ModernAdminLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={auth.user}
        onLogout={handleLogout}
        stats={stats}
      >
        {renderCurrentSection()}
      </ModernAdminLayout>

      {/* Event Form Modal */}
      {isEventFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsEventFormOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <EventForm
                editingEvent={editingEvent}
                createdEvent={createdEvent}
                isSaving={createEventMutation.isPending || updateEventMutation.isPending}
                onSave={handleEventSubmit}
                onCancel={() => {
                  setIsEventFormOpen(false);
                  setEditingEvent(null);
                  setCreatedEvent(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Homepage Photo Lightbox */}
      {isLightboxOpen && selectedPhotoIndex !== null && (
        <PhotoLightbox
          photos={homepagePhotos}
          currentIndex={selectedPhotoIndex}
          onClose={() => setIsLightboxOpen(false)}
          onDelete={(photoId) => {
            if (confirm('Yakin ingin menghapus foto ini secara permanen?')) {
              deletePhotoMutation.mutate(photoId, {
                onSuccess: () => {
                  setIsLightboxOpen(false); 
                },
              });
            }
          }}
          onLike={(photoId) => {
            // Like functionality not implemented in admin panel
            console.log('Like photo:', photoId);
          }}
          onUnlike={(photoId) => {
            // Unlike functionality not implemented in admin panel
            console.log('Unlike photo:', photoId);
          }}
        />
      )}

      {/* Event Photo Lightbox */}
      {isEventLightboxOpen && 
       selectedEventPhotoIndex !== null && 
       selectedEventPhotosForLightbox.length > 0 && 
       selectedEventPhotoIndex < selectedEventPhotosForLightbox.length &&
       selectedEventPhotosForLightbox[selectedEventPhotoIndex] && (
        <div key={`lightbox-${selectedEventPhotosForLightbox.length}-${selectedEventPhotoIndex}`}>
          <PhotoLightbox
          photos={selectedEventPhotosForLightbox.filter(photo => photo && photo.id)}
          currentIndex={Math.min(selectedEventPhotoIndex, selectedEventPhotosForLightbox.length - 1)}
          onClose={() => {
            // Safe close with timeout to prevent race conditions
            setTimeout(() => {
              setIsEventLightboxOpen(false);
              setSelectedEventPhotoIndex(null);
              setSelectedEventPhotosForLightbox([]);
            }, 0);
          }}
          onDelete={(photoId) => {
            if (confirm('Yakin ingin menghapus foto event ini secara permanen?')) {
              // Immediately update lightbox state to prevent errors
              const currentPhotos = [...selectedEventPhotosForLightbox];
              const photoIndex = currentPhotos.findIndex(photo => photo?.id === photoId);
              
              if (photoIndex !== -1) {
                const updatedPhotos = currentPhotos.filter(photo => photo?.id !== photoId);
                
                // Update state immediately
                setSelectedEventPhotosForLightbox(updatedPhotos);
                
                // Handle index adjustment
                if (updatedPhotos.length === 0) {
                  // Close lightbox if no photos left
                  setIsEventLightboxOpen(false);
                  setSelectedEventPhotoIndex(null);
                  setSelectedEventPhotosForLightbox([]);
                } else {
                  // Adjust index if needed
                  const currentIndex = selectedEventPhotoIndex || 0;
                  if (currentIndex >= updatedPhotos.length) {
                    setSelectedEventPhotoIndex(updatedPhotos.length - 1);
                  } else if (photoIndex <= currentIndex && currentIndex > 0) {
                    setSelectedEventPhotoIndex(currentIndex - 1);
                  }
                }
              }
              
              // Then perform the actual delete
              deleteEventPhotoMutation.mutate(photoId);
            }
          }}
          onLike={(photoId) => {
            // Like functionality not implemented in admin panel
            console.log('Like event photo:', photoId);
          }}
          onUnlike={(photoId) => {
            // Unlike functionality not implemented in admin panel
            console.log('Unlike event photo:', photoId);
          }}
          />
        </div>
      )}

      {/* QR Code Dialog */}
      <QRCodeDialog
        event={selectedEventForQR}
        isOpen={isQRDialogOpen}
        onClose={() => {
          setIsQRDialogOpen(false);
          setSelectedEventForQR(null);
        }}
      />
    </ToastProvider>
  );
}
