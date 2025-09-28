import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash, 
  Share2, 
  QrCode, 
  ExternalLink, 
  Calendar,
  Download,
  Archive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Database,
  Settings
} from "lucide-react";
import type { Event } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EventBackupManager } from "./event-backup-manager";
import { EventStatusManager, type EventWithStatus } from "./event-status-manager";
import { copyWithToast } from "@/utils/clipboard";
import { generateEventUrl } from "@/lib/app-config";

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onBackupComplete?: (eventId: string, result: any) => void;
  onArchiveComplete?: (eventId: string, result: any) => void;
  onStatusChange?: (eventId: string, newStatus: string) => void;
  onRefresh?: () => void;
}

export default function EventList({ 
  events, 
  onEdit, 
  onDelete, 
  onBackupComplete, 
  onArchiveComplete,
  onStatusChange,
  onRefresh
}: EventListProps) {
  const { toast } = useToast();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [backupStatuses, setBackupStatuses] = useState<Record<string, any>>({});

  const copyToClipboard = async (text: string, type: string) => {
    await copyWithToast(text, type, toast);
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const getBackupStatusBadge = (event: any) => {
    if (event.is_archived) {
      return (
        <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1">
          <Archive className="w-3 h-3" />
          Archived
        </Badge>
      );
    }
    
    const backupStatus = backupStatuses[event.id];
    if (backupStatus) {
      if (backupStatus.status === 'backing_up' || backupStatus.status === 'initializing') {
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Backing up...
          </Badge>
        );
      } else if (backupStatus.status === 'completed') {
        return (
          <Badge variant="default" className="bg-blue-600 text-white flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Backup Ready
          </Badge>
        );
      } else if (backupStatus.status === 'failed') {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Backup Failed
          </Badge>
        );
      }
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Database className="w-3 h-3" />
        No Backup
      </Badge>
    );
  };

  const handleBackupComplete = (eventId: string, result: any) => {
    setBackupStatuses(prev => ({
      ...prev,
      [eventId]: result
    }));
    
    if (onBackupComplete) {
      onBackupComplete(eventId, result);
    }
    
    toast({
      title: "Backup Completed!",
      description: `Event backup completed successfully.`,
    });
  };

  const handleArchiveComplete = (eventId: string, result: any) => {
    if (onArchiveComplete) {
      onArchiveComplete(eventId, result);
    }
    
    toast({
      title: "Event Archived!",
      description: `Event has been archived successfully.`,
    });
  };
  
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Belum ada event yang dibuat. Buat event pertama Anda!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="border-wedding-gold/20">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Main Event Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    {event.is_premium && (
                      <Badge className="bg-wedding-gold text-white">Premium</Badge>
                    )}
                    {getBackupStatusBadge(event)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tanggal: {new Date(event.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Kode Akses: <code className="bg-gray-100 px-2 py-1 rounded">{event.access_code}</code>
                  </p>
                  
                  {/* Archive Info */}
                  {event.is_archived && event.google_drive_backup_url && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <Archive className="w-4 h-4" />
                        Archived on {event.archived_at ? new Date(event.archived_at).toLocaleDateString('id-ID') : 'Unknown'}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(event.google_drive_backup_url as string, '_blank')}
                          className="ml-auto"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Backup
                        </Button>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        // Always generate fresh URL using correct base URL
                        const linkToCopy = generateEventUrl(event.id, event.access_code);
                        copyToClipboard(linkToCopy, "Link Share");
                      }}
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Copy Link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => event.qr_code && window.open(event.qr_code, '_blank')}>
                      <QrCode className="w-3 h-3 mr-1" /> QR Code
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Lihat Event
                    </Button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {/* Status Management Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => toggleEventExpansion(event.id)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {expandedEventId === event.id ? 'Hide Management' : 'Manage Event'}
                  </Button>
                  
                  {/* Edit Button */}
                  <Button size="sm" variant="outline" onClick={() => onEdit(event)} className="min-h-[44px] min-w-[44px]">
                    <Edit className="w-4 h-4" />
                    <span className="sr-only">Edit Event</span>
                  </Button>
                  
                  {/* Delete Button */}
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (confirm('Yakin ingin menghapus event ini? Semua foto dan pesan akan ikut terhapus.')) {
                      onDelete(event.id);
                    }
                  }} className="min-h-[44px] min-w-[44px]">
                    <Trash className="w-4 h-4" />
                    <span className="sr-only">Hapus Event</span>
                  </Button>
                </div>
              </div>
              
              {/* Expandable Event Management */}
              {expandedEventId === event.id && (
                <div className="border-t pt-4 space-y-6">
                  {/* Event Status Manager */}
                  {onStatusChange && (
                    <EventStatusManager
                      event={event as EventWithStatus}
                      onStatusChange={onStatusChange}
                      onRefresh={onRefresh}
                    />
                  )}
                  
                  {/* Event Backup Manager */}
                  <EventBackupManager
                    eventId={event.id}
                    eventName={event.name}
                    isArchived={event.is_archived}
                    onBackupComplete={(result) => handleBackupComplete(event.id, result)}
                    onArchiveComplete={(result) => handleArchiveComplete(event.id, result)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}