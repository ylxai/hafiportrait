// file: components/admin/EventForm.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { Event } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { copyWithToast } from "@/utils/clipboard";
import { generateEventUrl } from "@/lib/app-config";
import { QrCode, Share2, Copy, CheckCircle, ExternalLink } from "lucide-react";

// Definisikan tipe untuk data yang akan dikirim
export type EventFormData = {
  name: string;
  date: string;
  access_code: string;
  is_premium: boolean;
};

// Tipe untuk props komponen
interface EventFormProps {
  editingEvent: Event | null;
  onSave: (data: EventFormData & { id?: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
  createdEvent?: Event | null; // Event yang baru dibuat
}

export default function EventForm({ editingEvent, onSave, onCancel, isSaving, createdEvent }: EventFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [accessCode, setAccessCode] = useState<string>("");
  const [isPremium, setIsPremium] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // useEffect untuk mengisi form saat mode edit
  useEffect(() => {
    if (editingEvent) {
      setName(editingEvent.name);
      // Format tanggal YYYY-MM-DD untuk input type="date"
      setDate(new Date(editingEvent.date).toISOString().split('T')[0]);
      setAccessCode(editingEvent.access_code || "");
      setIsPremium(editingEvent.is_premium);
      setShowSuccess(false);
    } else {
      // Reset form jika tidak dalam mode edit
      setName("");
      setDate("");
      setAccessCode("");
      setIsPremium(false);
      setShowSuccess(false);
    }
  }, [editingEvent]);

  // useEffect untuk menampilkan success screen ketika event berhasil dibuat
  useEffect(() => {
    if (createdEvent && !editingEvent) {
      setShowSuccess(true);
      // Reset form
      setName("");
      setDate("");
      setAccessCode("");
      setIsPremium(false);
    }
  }, [createdEvent, editingEvent]);

  const handleSubmit = () => {
    if (!name || !date || !accessCode) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi semua field yang diperlukan.",
        variant: "destructive",
      });
      return;
    }
    
    onSave({
      id: editingEvent?.id,
      name,
      date,
      access_code: accessCode,
      is_premium: isPremium,
    });
  };

  const copyToClipboard = async (text: string, type: string) => {
    await copyWithToast(text, type, toast);
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setName("");
    setDate("");
    setAccessCode("");
    setIsPremium(false);
  };

  // Show success screen with QR code and event details
  if (showSuccess && createdEvent) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Event Berhasil Dibuat! 🎉</h3>
                <p className="text-green-700">Event "{createdEvent.name}" siap digunakan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <Card className="border-wedding-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-wedding-gold" />
                QR Code Event
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {createdEvent.qr_code ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                    <img 
                      src={createdEvent.qr_code} 
                      alt="QR Code Event" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => createdEvent?.qr_code && window.open(createdEvent.qr_code, '_blank')}
                      className="w-full bg-wedding-gold hover:bg-wedding-gold/90 text-black"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Buka QR Code
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(createdEvent.qr_code!, "QR Code URL")}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy QR Code URL
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 py-8">
                  <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>QR Code sedang diproses...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details Section */}
          <Card className="border-wedding-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-wedding-gold" />
                Informasi Event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nama Event</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{createdEvent.name}</p>
                </div>
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Tanggal Event</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p>{new Date(createdEvent.date).toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>

              {/* Access Code */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Kode Akses</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <code className="text-lg font-bold text-yellow-800">{createdEvent.access_code}</code>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(createdEvent.access_code!, "Kode Akses")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Shareable Link */}
              {createdEvent.id && createdEvent.access_code && (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const eventUrl = generateEventUrl(createdEvent.id, createdEvent.access_code);
                      window.open(eventUrl, '_blank');
                    }}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Buka Link Event
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const eventUrl = generateEventUrl(createdEvent.id, createdEvent.access_code);
                      copyToClipboard(eventUrl, "Link Event");
                    }}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link Event
                  </Button>
                </div>
              )}

              {/* Premium Badge */}
              {createdEvent.is_premium && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 font-medium">✨ Event Premium</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleCreateAnother}
            className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
          >
            ➕ Buat Event Lain
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            ✅ Selesai
          </Button>
        </div>
      </div>
    );
  }

  // Regular form for creating/editing event
  return (
    <Card className="mb-6 border-wedding-gold/20">
      <CardHeader>
        <CardTitle className="text-lg">
          {editingEvent ? "Edit Event" : "Buat Event Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="eventName">Nama Event</Label>
            <Input id="eventName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama event" />
          </div>
          <div>
            <Label htmlFor="eventDate">Tanggal Event</Label>
            <Input id="eventDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="accessCode">Kode Akses</Label>
            <Input id="accessCode" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Masukkan kode akses" />
          </div>
          <div className="flex items-center space-x-2 pb-2">
            <input type="checkbox" id="isPremium" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="h-4 w-4 rounded" />
            <Label htmlFor="isPremium">Event Premium</Label>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-wedding-gold hover:bg-wedding-gold/90 text-white">
            {isSaving ? <LoadingSpinner /> : (editingEvent ? "Update Event" : "Buat Event")}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}