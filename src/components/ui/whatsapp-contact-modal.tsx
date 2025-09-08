'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Phone, Mail, MessageCircle, Sparkles } from "lucide-react";
import { WhatsAppIntegration, PackageDetails, ContactInfo } from "@/lib/whatsapp-integration";

interface WhatsAppContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageDetails: PackageDetails;
}

export default function WhatsAppContactModal({ isOpen, onClose, packageDetails }: WhatsAppContactModalProps) {
  // Guard clause untuk packageDetails null
  if (!packageDetails) {
    return null;
  }
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    phone: '',
    email: '',
    eventDate: '',
    eventType: '',
    guestCount: undefined,
    venue: '',
    additionalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ContactInfo, value: string | number) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Open WhatsApp with package and contact info
    WhatsAppIntegration.openWhatsAppWithPackage(packageDetails, contactInfo);

    // Close modal
    onClose();
    setIsSubmitting(false);

    // Reset form
    setContactInfo({
      name: '',
      phone: '',
      email: '',
      eventDate: '',
      eventType: '',
      guestCount: undefined,
      venue: '',
      additionalNotes: ''
    });
  };

  const handleQuickContact = () => {
    // Quick contact without form
    WhatsAppIntegration.openWhatsAppWithPackage(packageDetails);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="w-6 h-6 text-green-500" />
            Hubungi via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Isi informasi di bawah untuk mendapatkan penawaran terbaik untuk paket <strong>{packageDetails.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Package Summary */}
        <div className="bg-dynamic-accent/5 rounded-lg p-4 border border-dynamic-accent/20 mb-4">
          <h4 className="font-semibold text-dynamic-primary mb-2">📦 Paket Dipilih:</h4>
          <div className="flex justify-between items-center">
            <span className="font-medium">{packageDetails.name}</span>
            <span className="text-lg font-bold text-dynamic-accent">{packageDetails.price}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-dynamic-primary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Informasi Kontak
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={contactInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama Anda"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">No. WhatsApp *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="08123456789"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email (Opsional)</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Event Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-dynamic-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Informasi Event
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventType">Jenis Event</Label>
                <Select onValueChange={(value) => handleInputChange('eventType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pernikahan">Pernikahan</SelectItem>
                    <SelectItem value="engagement">Lamaran</SelectItem>
                    <SelectItem value="prewedding">Pre-wedding</SelectItem>
                    <SelectItem value="birthday">Ulang Tahun</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="graduation">Wisuda</SelectItem>
                    <SelectItem value="family">Acara Keluarga</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eventDate">Tanggal Event</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={contactInfo.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestCount">Perkiraan Jumlah Tamu</Label>
                <Input
                  id="guestCount"
                  type="number"
                  value={contactInfo.guestCount || ''}
                  onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value) || 0)}
                  placeholder="50"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="venue">Lokasi/Venue</Label>
                <Input
                  id="venue"
                  value={contactInfo.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="Nama venue atau alamat"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              value={contactInfo.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              placeholder="Ceritakan lebih detail tentang event Anda, request khusus, atau pertanyaan lainnya..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !contactInfo.name || !contactInfo.phone}
              className="btn-dynamic-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Kirim ke WhatsApp
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickContact}
              className="btn-dynamic-secondary flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Chat Langsung
            </Button>
          </div>
        </form>

        {/* Trust Indicators */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">Respon cepat dalam 5 menit • Konsultasi gratis • No spam</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}