'use client';

/**
 * Photo Metadata Component
 * Displays comprehensive photo metadata including:
 * - Basic info (filename, size, dimensions)
 * - EXIF data (camera, settings)
 * - Statistics (views, downloads, likes)
 */

import { format } from 'date-fns';
import {
  FileImage,
  Calendar,
  Ruler,
  HardDrive,
  Camera,
  Eye,
  Download,
  Heart,
  Info,
} from 'lucide-react';
import { formatExifForDisplay } from '@/lib/utils/exif-formatter';

interface Photo {
  id: string;
  filename: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  created_at: Date;
  likes_count: number;
  views_count: number;
  download_count: number;
  exif_data?: any;
}

interface PhotoMetadataProps {
  photo: Photo;
  isLoading?: boolean;
}

export default function PhotoMetadata({ photo, isLoading }: PhotoMetadataProps) {
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDimensions = (width: number | null, height: number | null): string => {
    if (!width || !height) return 'Unknown';
    return `${width} × ${height} px`;
  };

  const formatMimeType = (mime_type: string | null): string => {
    if (!mime_type) return 'Unknown';
    const formats: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/gif': 'GIF',
    };
    return formats[mime_type.toLowerCase()] || mime_type.split('/')[1]?.toUpperCase() || 'Unknown';
  };

  const exifDisplay = photo.exif_data ? formatExifForDisplay(photo.exif_data) : {};
  const hasExif = Object.keys(exifDisplay).length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Photo Details</h2>
        <p className="mt-1 text-sm text-gray-500 break-all">{photo.filename}</p>
      </div>

      {/* Basic Information */}
      <div className="space-y-3">
        <h3 className="flex items-center text-sm font-semibold text-gray-900">
          <Info className="mr-2 h-4 w-4" />
          Basic Information
        </h3>
        
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          <MetadataRow
            icon={<Calendar className="h-4 w-4" />}
            label="Upload Date"
            value={format(new Date(photo.created_at), 'PPpp')}
          />
          
          <MetadataRow
            icon={<HardDrive className="h-4 w-4" />}
            label="File Size"
            value={formatFileSize(photo.file_size)}
          />
          
          <MetadataRow
            icon={<Ruler className="h-4 w-4" />}
            label="Dimensions"
            value={formatDimensions(photo.width, photo.height)}
          />
          
          <MetadataRow
            icon={<FileImage className="h-4 w-4" />}
            label="Format"
            value={formatMimeType(photo.mime_type)}
          />
        </div>
      </div>

      {/* EXIF Data */}
      {isLoading ? (
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ) : hasExif ? (
        <div className="space-y-3">
          <h3 className="flex items-center text-sm font-semibold text-gray-900">
            <Camera className="mr-2 h-4 w-4" />
            Camera Information
          </h3>
          
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            {Object.entries(exifDisplay).map(([label, value]) => (
              <MetadataRow
                key={label}
                label={label}
                value={value}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
          <Camera className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No EXIF data available</p>
        </div>
      )}

      {/* Statistics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Statistics</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Eye className="h-5 w-5" />}
            label="Views"
            value={photo.views_count}
            color="blue"
          />
          
          <StatCard
            icon={<Download className="h-5 w-5" />}
            label="Downloads"
            value={photo.download_count}
            color="green"
          />
          
          <StatCard
            icon={<Heart className="h-5 w-5" />}
            label="Likes"
            value={photo.likes_count}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata Row Component
 */
function MetadataRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="flex items-center text-gray-600">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </span>
      <span className="font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <div className={`mx-auto mb-2 inline-flex rounded-full p-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
