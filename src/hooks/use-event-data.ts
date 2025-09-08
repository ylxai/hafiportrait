'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Photo, Message, MessageReactions } from "@/lib/database";

export function useEventData(eventId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/events/${eventId}`);
      return response.json() as Promise<Event>;
    },
    enabled: !!eventId,
  });

  // Fetch event photos
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'photos'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/events/${eventId}/photos`);
      return response.json() as Promise<Photo[]>;
    },
    enabled: !!eventId,
    staleTime: 2 * 1000, // 2 seconds - very fresh data
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting
    refetchIntervalInBackground: true, // Continue refetching in background
  });

  // Fetch event messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'messages'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/events/${eventId}/messages`);
      return response.json() as Promise<Message[]>;
    },
    enabled: !!eventId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting
    refetchIntervalInBackground: true, // Continue refetching in background
  });

  // Verify access code mutation
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/verify-code`, { accessCode: code });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kode Akses Benar!",
        description: "Anda sekarang dapat mengupload foto.",
      });
    },
    onError: () => {
      toast({
        title: "Kode Salah",
        description: "Silakan periksa kembali kode akses Anda.",
        variant: "destructive",
      });
    },
  });

  // Manual refresh functions
  const refreshPhotos = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'photos'] });
  };

  const refreshMessages = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'messages'] });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
    queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'photos'] });
    queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'messages'] });
  };

  // Listen for broadcast events from admin panel
  useEffect(() => {
    const handlePhotoDeleted = (event: CustomEvent) => {
      if (event.detail.eventId === eventId) {
        console.log('📡 Received photo deleted broadcast, refreshing...');
        queryClient.refetchQueries({ queryKey: ['/api/events', eventId, 'photos'] });
      }
    };

    const handlePhotoUploaded = (event: CustomEvent) => {
      if (event.detail.eventId === eventId) {
        console.log('📡 Received photo uploaded broadcast, refreshing...');
        queryClient.refetchQueries({ queryKey: ['/api/events', eventId, 'photos'] });
      }
    };

    window.addEventListener('photoDeleted', handlePhotoDeleted as EventListener);
    window.addEventListener('photoUploaded', handlePhotoUploaded as EventListener);

    return () => {
      window.removeEventListener('photoDeleted', handlePhotoDeleted as EventListener);
      window.removeEventListener('photoUploaded', handlePhotoUploaded as EventListener);
    };
  }, [eventId, queryClient]);

  return {
    event,
    photos,
    messages,
    eventLoading,
    photosLoading,
    messagesLoading,
    verifyCodeMutation,
    queryClient,
    refreshPhotos,
    refreshMessages,
    refreshAll,
  };
}