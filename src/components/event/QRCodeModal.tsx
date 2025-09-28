'use client';

import { Button } from "@/components/ui/button";
import { QrCode, ExternalLink, Copy, Share2 } from "lucide-react";
import type { Event } from "@/lib/database";

interface QRCodeModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: (text: string) => void;
}

export default function QRCodeModal({ event, isOpen, onClose, onCopyLink }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">QR Code Event</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>
        <div className="p-6 text-center space-y-4">
          {event.qr_code ? (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                <img 
                  src={event.qr_code} 
                  alt="QR Code Event" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Scan QR code ini untuk mengakses event
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => event.qr_code && window.open(event.qr_code, '_blank')}
                    className="w-full bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Buka QR Code
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => event.qr_code && onCopyLink(event.qr_code)}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy QR Code URL
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => event.shareable_link && onCopyLink(event.shareable_link)}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link Event
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 py-8">
              <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>QR Code tidak tersedia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}