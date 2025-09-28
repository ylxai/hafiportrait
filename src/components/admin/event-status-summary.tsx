'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Archive, 
  Settings,
  TrendingUp,
  Clock,
  AlertTriangle
} from "lucide-react";
import type { Event } from "@/lib/database";

interface EventStatusSummaryProps {
  events: Event[];
}

export function EventStatusSummary({ events }: EventStatusSummaryProps) {
  // Count events by status
  const statusCounts = events.reduce((acc, event) => {
    const status = event.status || 'active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate additional metrics
  const totalEvents = events.length;
  const activeEvents = statusCounts.active || 0;
  const completedEvents = statusCounts.completed || 0;
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;
  const pastEvents = events.filter(e => new Date(e.date) < new Date()).length;
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.date).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  }).length;

  const statusConfig = {
    draft: { 
      icon: <Settings className="w-4 h-4" />, 
      label: "Draft", 
      color: "bg-gray-500",
      description: "Dalam persiapan"
    },
    active: { 
      icon: <Play className="w-4 h-4" />, 
      label: "Aktif", 
      color: "bg-green-500",
      description: "Sedang berlangsung"
    },
    paused: { 
      icon: <Pause className="w-4 h-4" />, 
      label: "Dijeda", 
      color: "bg-yellow-500",
      description: "Sementara dihentikan"
    },
    completed: { 
      icon: <CheckCircle className="w-4 h-4" />, 
      label: "Selesai", 
      color: "bg-blue-500",
      description: "Telah berakhir"
    },
    cancelled: { 
      icon: <XCircle className="w-4 h-4" />, 
      label: "Dibatalkan", 
      color: "bg-red-500",
      description: "Tidak jadi dilaksanakan"
    },
    archived: { 
      icon: <Archive className="w-4 h-4" />, 
      label: "Diarsipkan", 
      color: "bg-gray-400",
      description: "Disimpan untuk referensi"
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Overall Statistics */}
      <Card className="border-wedding-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-wedding-gold" />
            Ringkasan Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Event</span>
            <span className="font-semibold text-lg">{totalEvents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Event Aktif</span>
            <span className="font-semibold text-green-600">{activeEvents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Event Selesai</span>
            <span className="font-semibold text-blue-600">{completedEvents}</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Statistics */}
      <Card className="border-wedding-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-wedding-gold" />
            Timeline Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Hari Ini</span>
            <div className="flex items-center gap-2">
              {todayEvents > 0 && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
              <span className="font-semibold text-orange-600">{todayEvents}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mendatang</span>
            <span className="font-semibold text-blue-600">{upcomingEvents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Sudah Lewat</span>
            <span className="font-semibold text-gray-600">{pastEvents}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="border-wedding-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-wedding-gold" />
            Status Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${config.color} text-white border-none`}
                  >
                    {config.icon}
                    {config.label}
                  </Badge>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            );
          })}
          
          {totalEvents === 0 && (
            <div className="text-center text-gray-500 py-4">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Belum ada event</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}