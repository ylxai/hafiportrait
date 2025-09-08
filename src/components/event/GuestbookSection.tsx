'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { GuestbookErrorBoundary } from "@/components/error";
import { GuestbookSkeleton, MessageCardSkeleton } from "@/components/ui/enhanced-skeleton";
import type { Message, MessageReactions } from "@/lib/database";
import { UseMutationResult } from "@tanstack/react-query";

interface GuestbookSectionProps {
  messages: Message[];
  isLoading: boolean;
  addMessageMutation: UseMutationResult<any, Error, { guestName: string; message: string }, unknown>;
  likeMessageMutation: UseMutationResult<any, Error, string, unknown>;
  addReactionMutation: UseMutationResult<any, Error, { messageId: string; reactionType: keyof MessageReactions }, unknown>;
  onLikeMessage: (messageId: string) => void;
  onAddReaction: (messageId: string, reactionType: keyof MessageReactions) => void;
}

export default function GuestbookSection({
  messages,
  isLoading,
  addMessageMutation,
  likeMessageMutation,
  addReactionMutation,
  onLikeMessage,
  onAddReaction
}: GuestbookSectionProps) {
  const isMobile = useIsMobile();
  const [guestName, setGuestName] = useState("");
  const [messageText, setMessageText] = useState("");

  const handleSubmitMessage = () => {
    if (!guestName.trim() || !messageText.trim()) {
      return;
    }

    addMessageMutation.mutate(
      {
        guestName: guestName.trim(),
        message: messageText.trim(),
      },
      {
        onSuccess: () => {
          setGuestName("");
          setMessageText("");
        }
      }
    );
  };

  const reactionEmojis = {
    love: "😍",
    laugh: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😠"
  };

  return (
    <GuestbookErrorBoundary>
      <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
        <div className="text-center">
          <h2 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            Buku Tamu Digital
          </h2>
          <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : 'mb-6'}`}>
            Tinggalkan pesan dan ucapan untuk pengantin
          </p>
        </div>

        {/* Message Form */}
        <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Nama Anda"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={isMobile ? 'h-10 text-base' : ''}
              disabled={addMessageMutation.isPending}
            />
            <Textarea
              placeholder="Tulis pesan atau ucapan Anda..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              className={isMobile ? 'text-base resize-none' : ''}
              disabled={addMessageMutation.isPending}
            />
            
            <Button
              onClick={handleSubmitMessage}
              disabled={addMessageMutation.isPending || !guestName.trim() || !messageText.trim()}
              className={`w-full bg-wedding-gold text-black hover:bg-wedding-gold/90 ${
                isMobile ? 'h-11' : ''
              }`}
            >
              {addMessageMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  <span>Mengirim...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Kirim Pesan</span>
                </div>
              )}
            </Button>
          </div>
        </Card>

        {/* Messages List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <MessageCardSkeleton key={index} />
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {message.guest_name || message.sender_name}
                      </h4>
                      <p className="text-gray-600 mt-1">
                        {message.message || message.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(message.created_at || message.sent_at || new Date()).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLikeMessage(message.id)}
                      disabled={likeMessageMutation.isPending}
                      className={`flex items-center space-x-1 text-wedding-rose hover:bg-wedding-rose/10 transition-all duration-200 ${
                        likeMessageMutation.isPending ? 'opacity-50' : 'hover:scale-105'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${
                        likeMessageMutation.isPending ? 'animate-pulse' : ''
                      }`} />
                      <span className="font-medium">{message.hearts || 0}</span>
                    </Button>
                  </div>
                  
                  {/* Reactions Section */}
                  <div className="border-t pt-3">
                    {/* Display existing reactions */}
                    {message.reactions && Object.values(message.reactions).some(count => count > 0) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(message.reactions).map(([reaction, count]) => {
                          if (count === 0) return null;
                          return (
                            <span
                              key={reaction}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                            >
                              <span>{reactionEmojis[reaction as keyof MessageReactions]}</span>
                              <span className="font-medium">{count}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Reaction buttons */}
                    <div className="flex flex-wrap gap-1">
                      {(['love', 'laugh', 'wow', 'sad', 'angry'] as const).map((reactionType) => (
                        <Button
                          key={reactionType}
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddReaction(message.id, reactionType)}
                          disabled={addReactionMutation.isPending}
                          className={`p-2 h-8 w-8 hover:scale-110 transition-all duration-200 ${
                            addReactionMutation.isPending ? 'opacity-50' : ''
                          }`}
                          title={`React with ${reactionType}`}
                        >
                          <span className="text-lg">{reactionEmojis[reactionType]}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada pesan. Jadilah yang pertama menulis ucapan!</p>
          </div>
        )}
      </div>
    </GuestbookErrorBoundary>
  );
}