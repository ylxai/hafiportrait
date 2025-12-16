/**
 * SortablePhotoItem Component
 * Individual draggable photo item
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { GripVertical, Star, Heart, Eye } from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  originalUrl: string;
  thumbnailSmallUrl: string | null;
  thumbnailMediumUrl: string | null;
  thumbnailLargeUrl: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  isFeatured: boolean;
  likesCount: number;
  viewsCount: number;
}

interface SortablePhotoItemProps {
  photo: Photo;
  onClick: (photoId: string) => void;
  isDragging?: boolean;
}

export default function SortablePhotoItem({
  photo,
  onClick,
  isDragging = false,
}: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const thumbnailUrl =
    photo.thumbnailMediumUrl ||
    photo.thumbnailSmallUrl ||
    photo.originalUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all hover:shadow-md"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 cursor-grab rounded-lg bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Featured Badge */}
      {photo.isFeatured && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-yellow-500 p-1.5 shadow-md">
          <Star className="h-3 w-3 fill-white text-white" />
        </div>
      )}

      {/* Photo Image */}
      <button
        onClick={() => onClick(photo.id)}
        className="h-full w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#54ACBF] focus:ring-offset-2"
      >
        <Image
          src={thumbnailUrl}
          alt={`Admin photo: ${photo.filename}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {/* Overlay with Stats */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 z-10">
        <div className="flex items-center gap-3 text-xs text-white">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{photo.likesCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{photo.viewsCount}</span>
          </div>
        </div>
        <p className="mt-1 truncate text-xs text-white/90" title={photo.filename}>
          {photo.filename}
        </p>
      </div>

      {/* File Size Badge */}
      {photo.fileSize && (
        <div className="absolute left-2 bottom-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
          {formatFileSize(photo.fileSize)}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
