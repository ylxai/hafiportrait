'use client';

import { Button } from "@/components/ui/button";
import { Share2, QrCode } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Event } from "@/lib/database";

interface EventHeaderProps {
  event: Event;
  onShare: () => void;
  onShowQR: () => void;
}

export default function EventHeader({ event, onShare, onShowQR }: EventHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-wedding-gold/20 shadow-sm">
      <div className="mobile-container">
        <div className={`flex items-center justify-between ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className="flex-1 min-w-0">
            <h1 className={`font-bold text-gray-800 truncate ${
              isMobile ? 'text-xl leading-tight' : 'text-3xl'
            }`}>
              {event.name}
            </h1>
            <p className={`text-gray-600 truncate ${
              isMobile ? 'text-xs mt-1' : 'text-sm'
            }`}>
              {new Date(event.date).toLocaleDateString('id-ID', { 
                weekday: isMobile ? 'short' : 'long', 
                year: 'numeric', 
                month: isMobile ? 'short' : 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={onShare}
              className={`mobile-button ${isMobile ? 'px-3 py-2' : ''}`}
            >
              <Share2 className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              {!isMobile && <span className="ml-2">Share</span>}
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={onShowQR}
              className={`mobile-button ${isMobile ? 'px-3 py-2' : ''}`}
            >
              <QrCode className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              {!isMobile && <span className="ml-2">QR</span>}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}