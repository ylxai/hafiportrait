'use client';

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/ui/loading-spinner";
import PhotoLightbox from "@/components/photo-lightbox";
import { EventPageSkeleton, EventHeaderSkeleton, AccessCodeSkeleton } from "@/components/ui/enhanced-skeleton";

// Custom hooks
import { useEventData } from "@/hooks/use-event-data";
import { useEventActions } from "@/hooks/use-event-actions";
import { generateEventUrl } from "@/lib/app-config";

// Event components
import EventHeader from "@/components/event/EventHeader";
import AccessCodeForm from "@/components/event/AccessCodeForm";
import PhotoTab from "@/components/event/PhotoTab";
import GuestbookSection from "@/components/event/GuestbookSection";
import QRCodeModal from "@/components/event/QRCodeModal";

// Error boundaries
import { EventErrorBoundary } from "@/components/error";

export default function EventPage() {
  const params = useParams();
  const id = params?.id as string;
  const isMobile = useIsMobile();
  

  // State management
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState("Official");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Custom hooks
  const {
    event,
    photos,
    messages,
    eventLoading,
    photosLoading,
    messagesLoading,
    verifyCodeMutation,
  } = useEventData(id) as any;

  const {
    addMessageMutation,
    likeMessageMutation,
    likePhotoMutation,
    addReactionMutation,
    copyToClipboard,
  } = useEventActions(id) as any;

  // Enhanced photo filtering and sorting
  const filteredPhotos = useMemo(() => {
    return photos.filter(p => p.album_name === selectedAlbum);
  }, [photos, selectedAlbum]);

  // Event handlers
  const handlePhotoClick = (photoIndexInAlbum: number) => {
    setSelectedPhotoIndex(photoIndexInAlbum);
    setIsLightboxOpen(true);
  };

  const handleLikeMessage = (messageId: string) => {
    likeMessageMutation.mutate(messageId);
  };

  const handleAddReaction = (messageId: string, reactionType: any) => {
    addReactionMutation.mutate({ messageId, reactionType });
  };

  const handleLikePhoto = (photoId: string) => {
    likePhotoMutation.mutate(photoId);
  };

  const handleDeletePhoto = (photoId: string) => {
    console.log('Delete photo:', photoId);
  };

  const handleShare = () => {
    if (event?.id && event?.access_code) {
      // Always generate fresh URL using correct base URL
      const shareableUrl = generateEventUrl(event.id, event.access_code);
      copyToClipboard(shareableUrl);
    }
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  // Update verification success handler  
  const enhancedVerifyCodeMutation = useMemo(() => ({
    ...verifyCodeMutation,
    mutate: (code: string) => {
      verifyCodeMutation.mutate(code, {
        onSuccess: () => {
          setIsCodeVerified(true);
        }
      });
    }
  }), [verifyCodeMutation]);

  // Loading state with skeleton
  if (eventLoading) {
    return <EventPageSkeleton />;
  }

  // Error state
  if (!event) {
    return (
      <div className="min-h-screen bg-wedding-ivory flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Acara Tidak Ditemukan</h1>
          <p className="text-gray-600">Acara yang Anda cari tidak ada atau telah dihapus.</p>
        </div>
      </div>
    );
  }

  const needsAccessCode = (selectedAlbum === "Tamu" || selectedAlbum === "Bridesmaid") && !isCodeVerified;

  return (
    <EventErrorBoundary eventId={id}>
      <div className="min-h-screen bg-wedding-ivory">
        {/* Header */}
        <EventHeader
          event={event}
          onShare={handleShare}
          onShowQR={handleShowQR}
        />

        <div className="mobile-container mobile-spacing">
          {/* Access Code Form */}
          {needsAccessCode && (
            <AccessCodeForm
              selectedAlbum={selectedAlbum}
              verifyCodeMutation={enhancedVerifyCodeMutation}
            />
          )}

          {/* Main Tabs */}
          <Tabs value={selectedAlbum} onValueChange={setSelectedAlbum} className="w-full">
            <div className={isMobile ? 'mobile-tabs-container' : ''}>
              <TabsList className={`${
                isMobile 
                  ? 'mobile-tabs-list grid grid-cols-4 h-auto p-1' 
                  : 'grid w-full grid-cols-4'
              }`}>
                {['Official', 'Tamu', 'Bridesmaid', 'Guestbook'].map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab} 
                    className={isMobile ? 'mobile-tab text-xs py-3' : ''}
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Photo Tabs */}
            {["Official", "Tamu", "Bridesmaid"].map((album) => (
              <TabsContent key={album} value={album}>
                <PhotoTab
                  albumName={album}
                  eventId={id}
                  photos={photos}
                  isLoading={photosLoading}
                  needsAccessCode={needsAccessCode}
                  onPhotoClick={handlePhotoClick}
                />
              </TabsContent>
            ))}

            {/* Guestbook Tab */}
            <TabsContent value="Guestbook">
              <GuestbookSection
                messages={messages}
                isLoading={messagesLoading}
                addMessageMutation={addMessageMutation}
                likeMessageMutation={likeMessageMutation}
                addReactionMutation={addReactionMutation}
                onLikeMessage={handleLikeMessage}
                onAddReaction={handleAddReaction}
              />
            </TabsContent>
          </Tabs>

          {/* Photo Lightbox */}
          {isLightboxOpen && selectedPhotoIndex !== null && (
            <PhotoLightbox
              photos={filteredPhotos} 
              currentIndex={selectedPhotoIndex}
              onClose={() => setIsLightboxOpen(false)}
              onDelete={handleDeletePhoto}
              onLike={handleLikePhoto}
              onUnlike={() => {}}
            />
          )}

          {/* QR Code Modal */}
          <QRCodeModal
            event={event}
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            onCopyLink={copyToClipboard}
          />
        </div>
      </div>
    </EventErrorBoundary>
  );
}