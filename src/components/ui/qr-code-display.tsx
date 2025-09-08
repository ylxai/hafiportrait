'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, QrCode } from 'lucide-react';
import Image from 'next/image';
import { copyToClipboard } from '@/utils/clipboard';

interface QRCodeDisplayProps {
  qrCodeUrl: string | null;
  shareableLink: string | null;
  eventName: string;
}

export function QRCodeDisplay({ qrCodeUrl, shareableLink, eventName }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyLink = async () => {
    if (!shareableLink) return;
    
    const success = await copyToClipboard(shareableLink);
    if (success) {
      setCopied(true);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${eventName.replace(/\s+/g, '-')}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!qrCodeUrl) {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-lg">
            <QrCode className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-500">QR Code tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square mb-4">
            {/* Use next/image for better performance */}
            <img 
              src={qrCodeUrl} 
              alt={`QR Code untuk ${eventName}`}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="w-full flex flex-col gap-2">
            <Button 
              onClick={handleCopyLink} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Link Tersalin!' : 'Salin Link'}
            </Button>
            
            <Button 
              onClick={handleDownloadQR} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Unduh QR Code
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}