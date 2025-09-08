'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import type { Event } from "@/lib/database";

interface QRCodeDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeDialog({ event, isOpen, onClose }: QRCodeDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code untuk {event.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <QRCodeDisplay 
            qrCodeUrl={event.qr_code} 
            shareableLink={event.shareable_link}
            eventName={event.name}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}