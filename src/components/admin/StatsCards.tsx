
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Camera, MessageSquare } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalEvents: number;
    totalPhotos: number;
    totalMessages: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-gray-700">Total Event</CardTitle>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalEvents || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Event aktif & selesai</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-gray-700">Total Foto</CardTitle>
          <div className="p-2 bg-green-100 rounded-lg">
            <Camera className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalPhotos || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Di semua galeri</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium text-gray-700">Total Pesan</CardTitle>
          <div className="p-2 bg-purple-100 rounded-lg">
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalMessages || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Dari pengunjung</p>
        </CardContent>
      </Card>
    </div>
  );
}