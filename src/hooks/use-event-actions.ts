'use client';

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Photo, MessageReactions } from "@/lib/database";
import { copyWithToast } from "@/utils/clipboard";

export function useEventActions(eventId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Message submission mutation
  const addMessageMutation = useMutation({
    mutationFn: async (data: { guestName: string; message: string }) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'messages'] });
      toast({
        title: "Pesan Berhasil Dikirim!",
        description: "Pesan Anda telah ditambahkan ke buku tamu.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal mengirim pesan.",
        variant: "destructive",
      });
    },
  });

  // Like message mutation
  const likeMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("POST", `/api/messages/${messageId}/hearts`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'messages'] });
      toast({
        title: "❤️ Liked!",
        description: "Anda menyukai pesan ini.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal memberikan like.",
        variant: "destructive",
      });
    },
  });

  // Like photo mutation
  const likePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest("PATCH", `/api/photos/${photoId}/likes`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'photos'] });
      toast({
        title: "❤️ Liked!",
        description: "Anda menyukai foto ini.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal memberikan like pada foto.",
        variant: "destructive",
      });
    },
  });

  // Reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, reactionType }: { messageId: string; reactionType: keyof MessageReactions }) => {
      const response = await apiRequest("POST", `/api/messages/${messageId}/reactions`, {
        reactionType
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'messages'] });
      const reactionEmojis = {
        love: "😍",
        laugh: "😂",
        wow: "😮",
        sad: "😢",
        angry: "😠"
      };
      toast({
        title: `${reactionEmojis[variables.reactionType]} Reaction Added!`,
        description: `Anda memberikan reaksi ${variables.reactionType}.`,
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal memberikan reaksi.",
        variant: "destructive",
      });
    },
  });

  // Utility functions
  const copyToClipboard = async (text: string) => {
    await copyWithToast(text, "Link", toast);
  };

  const downloadPhoto = async (photoUrl: string, fileName: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Berhasil!",
        description: `Foto ${fileName} telah didownload.`,
      });
    } catch (error) {
      toast({
        title: "Download Gagal",
        description: "Tidak dapat mendownload foto.",
        variant: "destructive",
      });
    }
  };

  return {
    addMessageMutation,
    likeMessageMutation,
    likePhotoMutation,
    addReactionMutation,
    copyToClipboard,
    downloadPhoto,
  };
}