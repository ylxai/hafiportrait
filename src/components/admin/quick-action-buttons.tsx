'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Calendar, 
  Image, 
  Settings, 
  BarChart3,
  Upload,
  QrCode,
  Monitor
} from "lucide-react";

interface QuickActionButtonsProps {
  onCreateEvent?: () => void;
  onUploadPhoto?: () => void;
  onViewAnalytics?: () => void;
  onSystemCheck?: () => void;
}

export function QuickActionButtons({ 
  onCreateEvent, 
  onUploadPhoto, 
  onViewAnalytics, 
  onSystemCheck 
}: QuickActionButtonsProps) {
  const actions = [
    {
      label: "Buat Event",
      icon: Plus,
      color: "bg-blue-500 hover:bg-blue-600",
      action: onCreateEvent
    },
    {
      label: "Upload Foto",
      icon: Upload,
      color: "bg-green-500 hover:bg-green-600",
      action: onUploadPhoto
    },
    {
      label: "Analytics",
      icon: BarChart3,
      color: "bg-purple-500 hover:bg-purple-600",
      action: onViewAnalytics
    },
    {
      label: "System Check",
      icon: Monitor,
      color: "bg-orange-500 hover:bg-orange-600",
      action: onSystemCheck
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white h-16 flex flex-col items-center justify-center space-y-1 text-center`}
            >
              <action.icon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}