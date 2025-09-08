'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Calendar,
  Users,
  Camera,
  MessageSquare,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/lib/database";

// Event Status Types
export type EventStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';

export interface EventWithStatus extends Event {
  status?: EventStatus;
  participant_count?: number;
  photo_count?: number;
  message_count?: number;
  last_activity?: string;
}

interface EventStatusManagerProps {
  event: EventWithStatus;
  onStatusChange: (eventId: string, newStatus: EventStatus) => void;
  onRefresh?: () => void;
}

export function EventStatusManager({ 
  event, 
  onStatusChange, 
  onRefresh 
}: EventStatusManagerProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatus = event.status || 'draft';

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (newStatus === currentStatus) return;

    // Validation logic
    if (currentStatus === 'archived' && newStatus !== 'active') {
      toast({
        title: "Tidak Dapat Mengubah Status",
        description: "Event yang sudah diarsipkan hanya bisa diaktifkan kembali.",
        variant: "destructive",
      });
      return;
    }

    if (currentStatus === 'cancelled' && !['draft', 'active'].includes(newStatus)) {
      toast({
        title: "Tidak Dapat Mengubah Status",
        description: "Event yang dibatalkan hanya bisa dikembalikan ke draft atau aktif.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusChange(event.id, newStatus);
      
      toast({
        title: "Status Event Berhasil Diubah!",
        description: `Event "${event.name}" sekarang berstatus ${getStatusLabel(newStatus)}.`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Gagal Mengubah Status",
        description: "Terjadi kesalahan saat mengubah status event.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const statusConfig = {
      draft: { 
        variant: "secondary" as const, 
        icon: <Settings className="w-3 h-3" />, 
        label: "Draft",
        color: "bg-gray-500"
      },
      active: { 
        variant: "default" as const, 
        icon: <Play className="w-3 h-3" />, 
        label: "Aktif",
        color: "bg-green-500"
      },
      paused: { 
        variant: "secondary" as const, 
        icon: <Pause className="w-3 h-3" />, 
        label: "Dijeda",
        color: "bg-yellow-500"
      },
      completed: { 
        variant: "default" as const, 
        icon: <CheckCircle className="w-3 h-3" />, 
        label: "Selesai",
        color: "bg-blue-500"
      },
      cancelled: { 
        variant: "destructive" as const, 
        icon: <XCircle className="w-3 h-3" />, 
        label: "Dibatalkan",
        color: "bg-red-500"
      },
      archived: { 
        variant: "outline" as const, 
        icon: <Square className="w-3 h-3" />, 
        label: "Diarsipkan",
        color: "bg-gray-400"
      }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: EventStatus) => {
    const labels = {
      draft: "Draft",
      active: "Aktif", 
      paused: "Dijeda",
      completed: "Selesai",
      cancelled: "Dibatalkan",
      archived: "Diarsipkan"
    };
    return labels[status];
  };

  const getAvailableActions = (currentStatus: EventStatus) => {
    const actions = {
      draft: [
        { status: 'active' as EventStatus, label: 'Aktifkan Event', icon: <Play className="w-4 h-4" />, variant: 'default' as const },
        { status: 'cancelled' as EventStatus, label: 'Batalkan', icon: <XCircle className="w-4 h-4" />, variant: 'destructive' as const }
      ],
      active: [
        { status: 'paused' as EventStatus, label: 'Jeda Event', icon: <Pause className="w-4 h-4" />, variant: 'secondary' as const },
        { status: 'completed' as EventStatus, label: 'Selesaikan', icon: <CheckCircle className="w-4 h-4" />, variant: 'default' as const },
        { status: 'cancelled' as EventStatus, label: 'Batalkan', icon: <XCircle className="w-4 h-4" />, variant: 'destructive' as const }
      ],
      paused: [
        { status: 'active' as EventStatus, label: 'Lanjutkan', icon: <Play className="w-4 h-4" />, variant: 'default' as const },
        { status: 'completed' as EventStatus, label: 'Selesaikan', icon: <CheckCircle className="w-4 h-4" />, variant: 'default' as const },
        { status: 'cancelled' as EventStatus, label: 'Batalkan', icon: <XCircle className="w-4 h-4" />, variant: 'destructive' as const }
      ],
      completed: [
        { status: 'archived' as EventStatus, label: 'Arsipkan', icon: <Square className="w-4 h-4" />, variant: 'outline' as const },
        { status: 'active' as EventStatus, label: 'Aktifkan Kembali', icon: <Play className="w-4 h-4" />, variant: 'secondary' as const }
      ],
      cancelled: [
        { status: 'draft' as EventStatus, label: 'Kembalikan ke Draft', icon: <Settings className="w-4 h-4" />, variant: 'secondary' as const },
        { status: 'active' as EventStatus, label: 'Aktifkan Kembali', icon: <Play className="w-4 h-4" />, variant: 'default' as const }
      ],
      archived: [
        { status: 'active' as EventStatus, label: 'Aktifkan Kembali', icon: <Play className="w-4 h-4" />, variant: 'default' as const }
      ]
    };

    return actions[currentStatus] || [];
  };

  const getStatusDescription = (status: EventStatus) => {
    const descriptions = {
      draft: "Event masih dalam tahap persiapan dan belum dapat diakses oleh tamu.",
      active: "Event sedang berlangsung dan dapat diakses oleh tamu untuk upload foto dan kirim pesan.",
      paused: "Event dijeda sementara. Tamu tidak dapat upload foto atau kirim pesan baru.",
      completed: "Event telah selesai. Data masih dapat diakses tetapi tidak ada aktivitas baru.",
      cancelled: "Event dibatalkan. Semua aktivitas dihentikan.",
      archived: "Event diarsipkan untuk penyimpanan jangka panjang. Akses terbatas."
    };
    return descriptions[status];
  };

  const eventDate = new Date(event.date);
  const isEventPast = eventDate < new Date();
  const isEventToday = eventDate.toDateString() === new Date().toDateString();

  return (
    <Card className="border-wedding-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-wedding-gold" />
            Event Status Management
          </div>
          {getStatusBadge(currentStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Info Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-semibold">{event.participant_count || 0}</div>
            <div className="text-xs text-gray-600">Partisipan</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Camera className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-semibold">{event.photo_count || 0}</div>
            <div className="text-xs text-gray-600">Foto</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MessageSquare className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-semibold">{event.message_count || 0}</div>
            <div className="text-xs text-gray-600">Pesan</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <div className="text-xs font-semibold">
              {event.last_activity ? 
                new Date(event.last_activity).toLocaleDateString('id-ID') : 
                'Tidak ada'
              }
            </div>
            <div className="text-xs text-gray-600">Aktivitas Terakhir</div>
          </div>
        </div>

        {/* Event Date Warning */}
        {isEventToday && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Event berlangsung hari ini! Pastikan status sudah sesuai.
            </span>
          </div>
        )}

        {isEventPast && currentStatus === 'active' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Event sudah berlalu. Pertimbangkan untuk menyelesaikan atau mengarsipkan event.
            </span>
          </div>
        )}

        {/* Current Status Description */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Status Saat Ini: {getStatusLabel(currentStatus)}</h4>
          <p className="text-sm text-gray-600">{getStatusDescription(currentStatus)}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <h4 className="font-medium">Aksi yang Tersedia:</h4>
          <div className="flex flex-wrap gap-2">
            {getAvailableActions(currentStatus).map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                onClick={() => handleStatusChange(action.status)}
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Change Confirmation */}
        {isUpdating && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Mengubah status event...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}